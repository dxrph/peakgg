
-- ============ SEASONS ============
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT false,
  soft_reset_factor numeric NOT NULL DEFAULT 0.5,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX seasons_one_active_idx ON public.seasons (active) WHERE active = true;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Admin manages seasons" ON public.seasons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.season_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  game text NOT NULL,
  final_elo integer NOT NULL,
  final_rank text,
  placement integer NOT NULL,
  trophies_awarded integer NOT NULL DEFAULT 0,
  peak_coins_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, user_id, game)
);
ALTER TABLE public.season_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads season_results" ON public.season_results FOR SELECT USING (true);
CREATE POLICY "Admin manages season_results" ON public.season_results FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.profile_season_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  badge_label text NOT NULL,
  badge_color text NOT NULL DEFAULT '#ff4655',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, season_id)
);
ALTER TABLE public.profile_season_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads season badges" ON public.profile_season_badges FOR SELECT USING (true);
CREATE POLICY "Admin manages season badges" ON public.profile_season_badges FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============ BRACKET COLUMNS ON MATCHES ============
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS round integer,
  ADD COLUMN IF NOT EXISTS bracket_position integer,
  ADD COLUMN IF NOT EXISTS bracket_side text DEFAULT 'winner',
  ADD COLUMN IF NOT EXISTS next_match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_match_slot text;
CREATE INDEX IF NOT EXISTS matches_tournament_round_idx ON public.matches(tournament_id, round);

-- ============ CLOSE SEASON ============
CREATE OR REPLACE FUNCTION public.close_season(_season_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_placement int := 0;
  v_trophies int;
  v_coins int;
  v_factor numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can close seasons';
  END IF;

  SELECT soft_reset_factor INTO v_factor FROM public.seasons WHERE id = _season_id;
  IF v_factor IS NULL THEN
    RAISE EXCEPTION 'Season not found';
  END IF;

  -- snapshot top 100 per game
  FOR r IN
    SELECT ps.user_id, ps.game, ps.elo,
           ROW_NUMBER() OVER (PARTITION BY ps.game ORDER BY ps.elo DESC) AS rn
    FROM public.player_stats ps
    WHERE ps.matches_played > 0
    ORDER BY ps.game, ps.elo DESC
  LOOP
    EXIT WHEN r.rn > 100;
    v_placement := r.rn::int;
    v_trophies := CASE WHEN v_placement = 1 THEN 10 WHEN v_placement <= 3 THEN 5 WHEN v_placement <= 10 THEN 2 ELSE 1 END;
    v_coins := CASE WHEN v_placement = 1 THEN 1000 WHEN v_placement <= 3 THEN 500 WHEN v_placement <= 10 THEN 200 ELSE 50 END;

    INSERT INTO public.season_results (season_id, user_id, game, final_elo, placement, trophies_awarded, peak_coins_awarded)
    VALUES (_season_id, r.user_id, r.game, r.elo, v_placement, v_trophies, v_coins)
    ON CONFLICT DO NOTHING;

    UPDATE public.profiles SET trophies = COALESCE(trophies,0) + v_trophies WHERE id = r.user_id;

    INSERT INTO public.peak_coins_transactions (user_id, amount, reason)
    VALUES (r.user_id, v_coins, 'Season reward (#' || v_placement || ')');

    IF v_placement <= 100 THEN
      INSERT INTO public.profile_season_badges (user_id, season_id, badge_label, badge_color)
      VALUES (
        r.user_id, _season_id,
        'Top ' || v_placement || ' • ' || r.game,
        CASE WHEN v_placement = 1 THEN '#ffd700' WHEN v_placement <= 3 THEN '#c0c0c0' WHEN v_placement <= 10 THEN '#cd7f32' ELSE '#ff4655' END
      ) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- soft reset
  UPDATE public.player_stats
  SET elo = GREATEST(1000, ROUND(1000 + (elo - 1000) * v_factor)::int);

  UPDATE public.seasons SET active = false, closed_at = now() WHERE id = _season_id;
END;
$$;

-- ============ GENERATE BRACKET ============
CREATE OR REPLACE FUNCTION public.generate_bracket(_tournament_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_ids uuid[];
  n int;
  rounds int;
  size int;
  i int;
  r int;
  v_match_id uuid;
  v_prev_ids uuid[];
  v_curr_ids uuid[];
  v_game text;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'organizer')) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT game INTO v_game FROM public.tournaments WHERE id = _tournament_id;

  SELECT array_agg(team_id ORDER BY random())
  INTO team_ids
  FROM public.tournament_registrations
  WHERE tournament_id = _tournament_id;

  IF team_ids IS NULL OR array_length(team_ids,1) < 2 THEN
    RAISE EXCEPTION 'Not enough teams';
  END IF;

  -- delete existing bracket matches (status pending)
  DELETE FROM public.matches WHERE tournament_id = _tournament_id AND status = 'pending';

  n := array_length(team_ids, 1);
  size := 1;
  WHILE size < n LOOP size := size * 2; END LOOP;
  rounds := (ln(size) / ln(2))::int;

  -- Build last round upward: first create empty matches for all rounds 2..N
  -- Strategy: create rounds from final to first so we have next_match_id
  v_curr_ids := ARRAY[]::uuid[];
  FOR r IN REVERSE rounds..1 LOOP
    v_prev_ids := v_curr_ids;
    v_curr_ids := ARRAY[]::uuid[];
    FOR i IN 1..(size / (2 ^ (rounds - r + 1))::int) LOOP
      INSERT INTO public.matches (tournament_id, game, status, round, bracket_position, next_match_id, next_match_slot)
      VALUES (
        _tournament_id, v_game, 'pending', r, i,
        CASE WHEN r < rounds THEN v_prev_ids[((i - 1) / 2) + 1] ELSE NULL END,
        CASE WHEN r < rounds THEN (CASE WHEN i % 2 = 1 THEN 'a' ELSE 'b' END) ELSE NULL END
      )
      RETURNING id INTO v_match_id;
      v_curr_ids := array_append(v_curr_ids, v_match_id);
    END LOOP;
  END LOOP;

  -- Fill round 1 with team_ids (with byes for odd numbers)
  FOR i IN 1..(size/2) LOOP
    UPDATE public.matches
    SET team_a_id = team_ids[(i-1)*2 + 1],
        team_b_id = CASE WHEN (i-1)*2 + 2 <= n THEN team_ids[(i-1)*2 + 2] ELSE NULL END
    WHERE tournament_id = _tournament_id AND round = 1 AND bracket_position = i;
  END LOOP;
END;
$$;

-- ============ AWARD TOURNAMENT PRIZES ============
CREATE OR REPLACE FUNCTION public.award_tournament_prizes(_tournament_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_team uuid;
  v_runner_team uuid;
  v_third_team uuid[];
  v_max_round int;
  v_tier text;
  v_coins_1 int; v_coins_2 int; v_coins_3 int;
  v_name text;
  m record;
BEGIN
  SELECT MAX(round) INTO v_max_round FROM public.matches WHERE tournament_id = _tournament_id;
  IF v_max_round IS NULL THEN RETURN; END IF;

  SELECT name, COALESCE(reward_trophies, 0)::text INTO v_name, v_tier FROM public.tournaments WHERE id = _tournament_id;

  -- final
  SELECT winner_id INTO v_winner_team
  FROM public.matches WHERE tournament_id = _tournament_id AND round = v_max_round LIMIT 1;
  IF v_winner_team IS NULL THEN RETURN; END IF;

  SELECT CASE WHEN winner_id = team_a_id THEN team_b_id ELSE team_a_id END
  INTO v_runner_team
  FROM public.matches WHERE tournament_id = _tournament_id AND round = v_max_round LIMIT 1;

  -- Tier-based prize pool
  v_coins_1 := 200; v_coins_2 := 100; v_coins_3 := 50;

  -- Award winner
  UPDATE public.tournament_entries SET placement = 1, points_earned = COALESCE(points_earned,0) + 100
  WHERE tournament_id = _tournament_id AND team_id = v_winner_team;

  INSERT INTO public.peak_coins_transactions (user_id, amount, reason)
  SELECT tm.user_id, v_coins_1, 'Tournament 1st: ' || COALESCE(v_name,'')
  FROM public.team_members tm WHERE tm.team_id = v_winner_team;

  UPDATE public.profiles SET trophies = COALESCE(trophies,0) + 5
  WHERE id IN (SELECT user_id FROM public.team_members WHERE team_id = v_winner_team);

  INSERT INTO public.notifications (user_id, title, message)
  SELECT tm.user_id, '🏆 Hai vinto il torneo!', 'Hai vinto ' || COALESCE(v_name,'') || ' (+' || v_coins_1 || ' coins)'
  FROM public.team_members tm WHERE tm.team_id = v_winner_team;

  IF v_runner_team IS NOT NULL THEN
    UPDATE public.tournament_entries SET placement = 2, points_earned = COALESCE(points_earned,0) + 50
    WHERE tournament_id = _tournament_id AND team_id = v_runner_team;

    INSERT INTO public.peak_coins_transactions (user_id, amount, reason)
    SELECT tm.user_id, v_coins_2, 'Tournament 2nd: ' || COALESCE(v_name,'')
    FROM public.team_members tm WHERE tm.team_id = v_runner_team;

    UPDATE public.profiles SET trophies = COALESCE(trophies,0) + 3
    WHERE id IN (SELECT user_id FROM public.team_members WHERE team_id = v_runner_team);

    INSERT INTO public.notifications (user_id, title, message)
    SELECT tm.user_id, '🥈 Secondo posto!', 'Sei arrivato 2° in ' || COALESCE(v_name,'') || ' (+' || v_coins_2 || ' coins)'
    FROM public.team_members tm WHERE tm.team_id = v_runner_team;
  END IF;

  -- Semifinalists (round = v_max_round - 1, losers)
  IF v_max_round > 1 THEN
    FOR m IN
      SELECT CASE WHEN winner_id = team_a_id THEN team_b_id ELSE team_a_id END AS loser
      FROM public.matches
      WHERE tournament_id = _tournament_id AND round = v_max_round - 1 AND status = 'completed'
    LOOP
      IF m.loser IS NOT NULL THEN
        UPDATE public.tournament_entries SET placement = 3, points_earned = COALESCE(points_earned,0) + 25
        WHERE tournament_id = _tournament_id AND team_id = m.loser AND placement IS NULL;

        INSERT INTO public.peak_coins_transactions (user_id, amount, reason)
        SELECT tm.user_id, v_coins_3, 'Tournament 3rd: ' || COALESCE(v_name,'')
        FROM public.team_members tm WHERE tm.team_id = m.loser;

        UPDATE public.profiles SET trophies = COALESCE(trophies,0) + 1
        WHERE id IN (SELECT user_id FROM public.team_members WHERE team_id = m.loser);
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- ============ ADVANCE BRACKET TRIGGER ============
CREATE OR REPLACE FUNCTION public.advance_bracket_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL
     AND (OLD.status IS DISTINCT FROM 'completed' OR OLD.winner_id IS DISTINCT FROM NEW.winner_id) THEN

    IF NEW.next_match_id IS NOT NULL THEN
      IF NEW.next_match_slot = 'a' THEN
        UPDATE public.matches SET team_a_id = NEW.winner_id WHERE id = NEW.next_match_id;
      ELSE
        UPDATE public.matches SET team_b_id = NEW.winner_id WHERE id = NEW.next_match_id;
      END IF;
    ELSE
      -- final completed → award prizes
      IF NEW.tournament_id IS NOT NULL THEN
        PERFORM public.award_tournament_prizes(NEW.tournament_id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advance_bracket ON public.matches;
CREATE TRIGGER trg_advance_bracket
AFTER UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.advance_bracket_winner();
