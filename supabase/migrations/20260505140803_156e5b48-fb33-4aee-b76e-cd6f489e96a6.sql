-- 1. Smurf risk + activity tracking on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS smurf_risk_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS account_verified boolean NOT NULL DEFAULT false;

-- 2. Touch last_active_at when a match is logged
CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET last_active_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_last_active ON public.elo_history;
CREATE TRIGGER trg_touch_last_active
AFTER INSERT ON public.elo_history
FOR EACH ROW EXECUTE FUNCTION public.touch_last_active();

-- 3. Smurf risk recalculation
CREATE OR REPLACE FUNCTION public.recalculate_smurf_risk(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_age_days integer;
  v_matches integer;
  v_winrate numeric;
  v_elo_climb integer;
  v_streak integer;
  v_score integer := 0;
  v_verified boolean;
BEGIN
  SELECT EXTRACT(DAY FROM (now() - created_at))::int, account_verified
    INTO v_age_days, v_verified
    FROM public.profiles WHERE id = _user_id;

  SELECT COALESCE(SUM(matches_played), 0),
         COALESCE(SUM(wins)::numeric / NULLIF(SUM(matches_played), 0), 0),
         COALESCE(MAX(best_win_streak), 0)
    INTO v_matches, v_winrate, v_streak
    FROM public.player_stats WHERE user_id = _user_id;

  SELECT COALESCE(SUM(delta), 0) INTO v_elo_climb
    FROM public.elo_history
    WHERE user_id = _user_id AND created_at > now() - interval '7 days';

  -- Heuristic scoring
  IF v_age_days < 7 THEN v_score := v_score + 25; END IF;
  IF v_age_days < 30 THEN v_score := v_score + 10; END IF;
  IF v_winrate > 0.85 AND v_matches >= 5 THEN v_score := v_score + 30; END IF;
  IF v_winrate > 0.75 AND v_matches >= 10 THEN v_score := v_score + 15; END IF;
  IF v_streak >= 8 THEN v_score := v_score + 20; END IF;
  IF v_elo_climb > 200 THEN v_score := v_score + 25; END IF;
  IF NOT v_verified THEN v_score := v_score + 10; END IF;

  v_score := LEAST(100, GREATEST(0, v_score));

  UPDATE public.profiles SET smurf_risk_score = v_score WHERE id = _user_id;
  RETURN v_score;
END;
$$;

-- 4. ELO decay function (call via cron / admin button)
CREATE OR REPLACE FUNCTION public.apply_elo_decay()
RETURNS TABLE(affected_users integer, total_decay integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      AND ps.elo > 1000
      AND ps.matches_played > 0
  LOOP
    v_weeks_inactive := GREATEST(1, EXTRACT(DAY FROM (now() - r.last_active_at))::int / 7 - 2);
    v_decay := LEAST(r.elo - 1000, v_weeks_inactive * 10);
    IF v_decay <= 0 THEN CONTINUE; END IF;
    v_new_elo := r.elo - v_decay;

    UPDATE public.player_stats SET elo = v_new_elo WHERE id = r.id;
    INSERT INTO public.elo_history (user_id, game, elo_before, elo_after, delta, reason)
    VALUES (r.user_id, r.game, r.elo, v_new_elo, -v_decay, 'inactivity_decay');

    v_affected := v_affected + 1;
    v_total := v_total + v_decay;
  END LOOP;

  RETURN QUERY SELECT v_affected, v_total;
END;
$$;

-- 5. Dynamic ELO calculation helper (used by edge function via RPC option)
CREATE OR REPLACE FUNCTION public.calculate_dynamic_elo_delta(
  _player_elo integer,
  _opponent_elo integer,
  _won boolean
) RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_diff integer;
  v_modifier integer;
  v_base integer;
BEGIN
  v_diff := _opponent_elo - _player_elo;
  -- modifier scales with diff: stronger opponent → bigger reward, weaker → smaller
  v_modifier := GREATEST(-15, LEAST(15, v_diff / 20));

  IF _won THEN
    v_base := 25 + v_modifier;
    RETURN GREATEST(10, LEAST(40, v_base));
  ELSE
    v_base := -15 + v_modifier;
    RETURN LEAST(-5, GREATEST(-30, v_base));
  END IF;
END;
$$;