
-- 1. rank_definitions table
CREATE TABLE IF NOT EXISTS public.rank_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_key text UNIQUE NOT NULL,
  rank_name text NOT NULL,
  min_elo integer NOT NULL,
  max_elo integer,
  sort_order integer NOT NULL UNIQUE,
  description text,
  short_description text,
  emblem_url text,
  color_token text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rank_def_min_nonneg CHECK (min_elo >= 0),
  CONSTRAINT rank_def_range_valid CHECK (max_elo IS NULL OR max_elo >= min_elo)
);

ALTER TABLE public.rank_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rank_definitions readable by everyone"
  ON public.rank_definitions FOR SELECT USING (true);

CREATE POLICY "rank_definitions admin write"
  ON public.rank_definitions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER rank_definitions_touch
  BEFORE UPDATE ON public.rank_definitions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed
INSERT INTO public.rank_definitions (rank_key, rank_name, min_elo, max_elo, sort_order, short_description, description, color_token) VALUES
('rookie','Rookie',0,599,1,'Every player starts here.','Every player starts here. Learn the system, play matches and begin climbing.','#BFC3CC'),
('iron','Iron',600,999,2,'Early competitive stage.','Early competitive stage. Build consistency and reduce mistakes.','#6B7280'),
('bronze','Bronze',1000,1199,3,'First real competitive milestone.','The first real competitive milestone. Fundamentals start to matter.','#B45309'),
('silver','Silver',1200,1399,4,'Solid basics, better decisions.','Solid basics, better decision-making and more consistent performances.','#CBD5E1'),
('gold','Gold',1400,1599,5,'Reliable competitive player.','A reliable competitive player with stronger awareness and impact.','#F5B514'),
('platinum','Platinum',1600,1799,6,'High-level mechanics.','High-level mechanics and smarter team play start to separate you.','#3FD3D5'),
('diamond','Diamond',1800,1999,7,'Advanced competitive skill.','Advanced competitive skill. Players here can carry and adapt.','#4F8DF9'),
('elite','Elite',2000,2199,8,'Rare and dangerous.','Rare rank for highly consistent and dangerous players.','#A855F7'),
('master','Master',2200,2399,9,'Top-tier performance.','Top-tier competitive performance. Only serious grinders reach this level.','#EC4899'),
('apex','Apex',2400,NULL,10,'The peak of PeakGG.','The peak of PeakGG. Reserved for the best-performing players.','#EF4444')
ON CONFLICT (rank_key) DO NOTHING;

-- Helper: rank_name from elo (server-side single source of truth)
CREATE OR REPLACE FUNCTION public.rank_name_from_elo(_elo integer)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT rank_name FROM public.rank_definitions
  WHERE is_active = true
    AND _elo >= min_elo
    AND (max_elo IS NULL OR _elo <= max_elo)
  ORDER BY sort_order DESC LIMIT 1;
$$;

-- 2. player_stats: starting ELO = 0, add peak fields
ALTER TABLE public.player_stats ALTER COLUMN elo SET DEFAULT 0;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS peak_elo integer NOT NULL DEFAULT 0;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS peak_rank text NOT NULL DEFAULT 'Rookie';

-- Backfill: reset never-played users to 0/Rookie, sync peak for everyone
UPDATE public.player_stats
SET elo = 0, peak_elo = 0, peak_rank = 'Rookie'
WHERE matches_played = 0;

UPDATE public.player_stats
SET peak_elo = GREATEST(peak_elo, elo),
    peak_rank = COALESCE(public.rank_name_from_elo(GREATEST(peak_elo, elo)), 'Rookie')
WHERE matches_played > 0;

-- Trigger: keep peak in sync on every elo change + clamp ELO >= 0
CREATE OR REPLACE FUNCTION public.sync_peak_and_clamp_elo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.elo < 0 THEN NEW.elo := 0; END IF;
  IF NEW.elo > COALESCE(NEW.peak_elo, 0) THEN
    NEW.peak_elo := NEW.elo;
    NEW.peak_rank := COALESCE(public.rank_name_from_elo(NEW.elo), 'Rookie');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS player_stats_sync_peak ON public.player_stats;
CREATE TRIGGER player_stats_sync_peak
  BEFORE INSERT OR UPDATE OF elo ON public.player_stats
  FOR EACH ROW EXECUTE FUNCTION public.sync_peak_and_clamp_elo();

-- 3. Update new-profile trigger so new users start at 0
CREATE OR REPLACE FUNCTION public.create_player_stats_for_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.player_stats (user_id, game, elo, peak_elo, peak_rank)
  VALUES
    (NEW.id, 'valorant', 0, 0, 'Rookie'),
    (NEW.id, 'cs2',      0, 0, 'Rookie'),
    (NEW.id, 'r6s',      0, 0, 'Rookie')
  ON CONFLICT (user_id, game) DO NOTHING;
  RETURN NEW;
END $$;

-- 4. elo_history: add old/new rank + source_type
ALTER TABLE public.elo_history ADD COLUMN IF NOT EXISTS old_rank text;
ALTER TABLE public.elo_history ADD COLUMN IF NOT EXISTS new_rank text;
ALTER TABLE public.elo_history ADD COLUMN IF NOT EXISTS source_type text;

-- Trigger: auto-fill old_rank/new_rank from elo_before/elo_after if not provided
CREATE OR REPLACE FUNCTION public.elo_history_fill_ranks()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.old_rank IS NULL THEN
    NEW.old_rank := COALESCE(public.rank_name_from_elo(NEW.elo_before), 'Rookie');
  END IF;
  IF NEW.new_rank IS NULL THEN
    NEW.new_rank := COALESCE(public.rank_name_from_elo(NEW.elo_after), 'Rookie');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS elo_history_fill_ranks_trg ON public.elo_history;
CREATE TRIGGER elo_history_fill_ranks_trg
  BEFORE INSERT ON public.elo_history
  FOR EACH ROW EXECUTE FUNCTION public.elo_history_fill_ranks();

-- 5. Update apply_elo_decay floor to 0 (was 1000)
CREATE OR REPLACE FUNCTION public.apply_elo_decay()
RETURNS TABLE(affected_users integer, total_decay integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_affected integer := 0;
  v_total integer := 0;
  r record;
  v_weeks_inactive integer;
  v_decay integer;
  v_new_elo integer;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can apply decay';
  END IF;

  FOR r IN
    SELECT ps.id, ps.user_id, ps.game, ps.elo, p.last_active_at
    FROM public.player_stats ps
    JOIN public.profiles p ON p.id = ps.user_id
    WHERE p.last_active_at < now() - interval '14 days'
      AND ps.elo > 0
      AND ps.matches_played > 0
  LOOP
    v_weeks_inactive := GREATEST(1, EXTRACT(DAY FROM (now() - r.last_active_at))::int / 7 - 2);
    v_decay := LEAST(r.elo, v_weeks_inactive * 10);
    IF v_decay <= 0 THEN CONTINUE; END IF;
    v_new_elo := GREATEST(0, r.elo - v_decay);

    UPDATE public.player_stats SET elo = v_new_elo WHERE id = r.id;
    INSERT INTO public.elo_history (user_id, game, elo_before, elo_after, delta, reason, source_type)
    VALUES (r.user_id, r.game, r.elo, v_new_elo, -(r.elo - v_new_elo), 'inactivity_decay', 'system_decay');

    v_affected := v_affected + 1;
    v_total := v_total + (r.elo - v_new_elo);
  END LOOP;

  RETURN QUERY SELECT v_affected, v_total;
END $$;
