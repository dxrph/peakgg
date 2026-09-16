
-- ============== 1. EXTEND league_seasons ==============
ALTER TABLE public.league_seasons
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'EU',
  ADD COLUMN IF NOT EXISTS match_format text NOT NULL DEFAULT 'BO1',
  ADD COLUMN IF NOT EXISTS playoff_match_format text NOT NULL DEFAULT 'BO3',
  ADD COLUMN IF NOT EXISTS min_team_count int NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS max_team_count int,
  ADD COLUMN IF NOT EXISTS recommended_min_teams int NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS recommended_max_teams int NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS schedule_status text NOT NULL DEFAULT 'not_generated',
  ADD COLUMN IF NOT EXISTS is_founding_season boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS generated_format jsonb,
  ADD COLUMN IF NOT EXISTS format_status text NOT NULL DEFAULT 'not_generated';

-- ============== 2. EXTEND league_registrations ==============
ALTER TABLE public.league_registrations
  ADD COLUMN IF NOT EXISTS is_founding_team boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed int;

-- Prevent duplicate applications (drop & recreate to be safe)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'league_registrations_season_team_unique'
  ) THEN
    ALTER TABLE public.league_registrations
      ADD CONSTRAINT league_registrations_season_team_unique UNIQUE (season_id, team_id);
  END IF;
END $$;

-- ============== 3. EXTEND matches ==============
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'regular_season',
  ADD COLUMN IF NOT EXISTS rounds_a int,
  ADD COLUMN IF NOT EXISTS rounds_b int,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS confirmation_team_id uuid;

-- ============== 4. NEW: hall of fame ==============
CREATE TABLE IF NOT EXISTS public.league_hall_of_fame (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL UNIQUE,
  champion_team_id uuid,
  runner_up_team_id uuid,
  mvp_user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.league_hall_of_fame ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads hall of fame" ON public.league_hall_of_fame;
CREATE POLICY "Anyone reads hall of fame" ON public.league_hall_of_fame FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage hall of fame" ON public.league_hall_of_fame;
CREATE POLICY "Admins manage hall of fame" ON public.league_hall_of_fame FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============== 5. NEW: badges ==============
CREATE TABLE IF NOT EXISTS public.league_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  season_id uuid,
  code text NOT NULL,
  label text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_league_badges_team ON public.league_badges(team_id);
ALTER TABLE public.league_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads badges" ON public.league_badges;
CREATE POLICY "Anyone reads badges" ON public.league_badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage badges" ON public.league_badges;
CREATE POLICY "Admins manage badges" ON public.league_badges FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============== 6. RPC: recalc standings ==============
CREATE OR REPLACE FUNCTION public.recalculate_league_standings(_season_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _div_id uuid;
BEGIN
  SELECT id INTO _div_id FROM public.league_divisions
   WHERE season_id = _season_id ORDER BY tier ASC LIMIT 1;

  IF _div_id IS NULL THEN
    INSERT INTO public.league_divisions(season_id, tier, name)
    VALUES (_season_id, 1, 'Main') RETURNING id INTO _div_id;
  END IF;

  -- reset
  DELETE FROM public.league_standings WHERE division_id = _div_id;

  INSERT INTO public.league_standings(division_id, team_id, played, wins, draws, losses, points, round_diff, form, updated_at)
  SELECT
    _div_id,
    t.team_id,
    COUNT(*) FILTER (WHERE m.id IS NOT NULL),
    COUNT(*) FILTER (WHERE m.winner_id = t.team_id),
    0,
    COUNT(*) FILTER (WHERE m.winner_id IS NOT NULL AND m.winner_id <> t.team_id),
    COUNT(*) FILTER (WHERE m.winner_id = t.team_id) * 3,
    COALESCE(SUM(
      CASE
        WHEN m.team_a_id = t.team_id THEN COALESCE(m.rounds_a,0) - COALESCE(m.rounds_b,0)
        WHEN m.team_b_id = t.team_id THEN COALESCE(m.rounds_b,0) - COALESCE(m.rounds_a,0)
        ELSE 0
      END
    ), 0),
    COALESCE((
      SELECT array_agg(CASE WHEN winner_id = t.team_id THEN 'W' ELSE 'L' END ORDER BY played_at DESC)
      FROM (
        SELECT winner_id, played_at FROM public.matches
        WHERE season_id = _season_id
          AND stage = 'regular_season'
          AND result_status = 'completed'
          AND (team_a_id = t.team_id OR team_b_id = t.team_id)
        ORDER BY played_at DESC NULLS LAST LIMIT 5
      ) recent
    ), '{}'::text[]),
    now()
  FROM (
    SELECT team_id FROM public.league_registrations
    WHERE season_id = _season_id AND status = 'approved'
  ) t
  LEFT JOIN public.matches m
    ON m.season_id = _season_id
   AND m.stage = 'regular_season'
   AND m.result_status = 'completed'
   AND (m.team_a_id = t.team_id OR m.team_b_id = t.team_id)
  GROUP BY t.team_id;

  -- position
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, round_diff DESC) AS pos
    FROM public.league_standings WHERE division_id = _div_id
  )
  UPDATE public.league_standings s SET position = r.pos
  FROM ranked r WHERE r.id = s.id;
END;
$$;

-- ============== 7. RPC: generate format ==============
CREATE OR REPLACE FUNCTION public.generate_league_format(_season_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cnt int;
  _min int;
  _fmt jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT min_team_count INTO _min FROM public.league_seasons WHERE id = _season_id;
  SELECT COUNT(*) INTO _cnt FROM public.league_registrations
   WHERE season_id = _season_id AND status = 'approved';

  IF _cnt < COALESCE(_min, 4) THEN
    RAISE EXCEPTION 'Not enough approved teams (% / %)', _cnt, _min;
  END IF;

  IF _cnt BETWEEN 4 AND 7 THEN
    _fmt := jsonb_build_object(
      'teams', _cnt, 'mode', 'single_round_robin',
      'regular_match_format', 'BO1', 'playoff_match_format', 'BO3',
      'playoff_size', 2, 'playoff_label', 'Top 2 Final',
      'matchdays', CASE WHEN _cnt % 2 = 0 THEN _cnt - 1 ELSE _cnt END,
      'total_matches', (_cnt * (_cnt - 1)) / 2
    );
  ELSIF _cnt BETWEEN 8 AND 10 THEN
    _fmt := jsonb_build_object(
      'teams', _cnt, 'mode', 'single_round_robin',
      'regular_match_format', 'BO1', 'playoff_match_format', 'BO3',
      'playoff_size', 4, 'playoff_label', 'Top 4 Playoffs',
      'matchdays', CASE WHEN _cnt % 2 = 0 THEN _cnt - 1 ELSE _cnt END,
      'total_matches', (_cnt * (_cnt - 1)) / 2
    );
  ELSIF _cnt BETWEEN 11 AND 14 THEN
    _fmt := jsonb_build_object(
      'teams', _cnt, 'mode', 'single_round_robin',
      'regular_match_format', 'BO1', 'playoff_match_format', 'BO3',
      'playoff_size', 6, 'playoff_label', 'Top 6 Playoffs',
      'matchdays', CASE WHEN _cnt % 2 = 0 THEN _cnt - 1 ELSE _cnt END,
      'total_matches', (_cnt * (_cnt - 1)) / 2
    );
  ELSE
    _fmt := jsonb_build_object(
      'teams', _cnt, 'mode', 'groups_recommended',
      'recommendation', 'Split into 2 divisions or run as one large round-robin',
      'playoff_size', 8, 'playoff_label', 'Top 8 Playoffs'
    );
  END IF;

  UPDATE public.league_seasons
     SET generated_format = _fmt, format_status = 'generated', updated_at = now()
   WHERE id = _season_id;

  RETURN _fmt;
END;
$$;

-- ============== 8. RPC: generate schedule ==============
CREATE OR REPLACE FUNCTION public.generate_league_schedule(_season_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _teams uuid[];
  _n int;
  _round int;
  _i int;
  _ta uuid;
  _tb uuid;
  _rotation uuid[];
  _has_completed boolean;
  _created int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.matches
     WHERE season_id = _season_id AND result_status = 'completed'
  ) INTO _has_completed;

  IF _has_completed THEN
    RAISE EXCEPTION 'Cannot regenerate schedule: completed matches exist';
  END IF;

  -- wipe non-completed matches for this season
  DELETE FROM public.matches
   WHERE season_id = _season_id
     AND stage = 'regular_season'
     AND result_status <> 'completed';

  SELECT array_agg(team_id ORDER BY created_at)
    INTO _teams
    FROM public.league_registrations
   WHERE season_id = _season_id AND status = 'approved';

  _n := COALESCE(array_length(_teams,1), 0);
  IF _n < 4 THEN
    RAISE EXCEPTION 'Need at least 4 approved teams';
  END IF;

  -- For odd N, add NULL as BYE
  IF _n % 2 = 1 THEN
    _teams := _teams || ARRAY[NULL]::uuid[];
    _n := _n + 1;
  END IF;

  _rotation := _teams;
  FOR _round IN 1.._n - 1 LOOP
    FOR _i IN 1.._n / 2 LOOP
      _ta := _rotation[_i];
      _tb := _rotation[_n - _i + 1];
      IF _ta IS NOT NULL AND _tb IS NOT NULL THEN
        INSERT INTO public.matches(
          season_id, matchday, stage, team_a_id, team_b_id,
          status, result_status, game, kind, bo_format
        ) VALUES (
          _season_id, _round, 'regular_season', _ta, _tb,
          'pending', 'scheduled', 'valorant', 'league', 'BO1'
        );
        _created := _created + 1;
      END IF;
    END LOOP;
    -- rotate: fix first, rotate the rest clockwise
    _rotation := ARRAY[_rotation[1]] || ARRAY[_rotation[_n]] || _rotation[2:_n-1];
  END LOOP;

  UPDATE public.league_seasons
     SET schedule_status = 'draft', updated_at = now()
   WHERE id = _season_id;

  PERFORM public.recalculate_league_standings(_season_id);
  RETURN _created;
END;
$$;

-- ============== 9. RPC: generate playoffs ==============
CREATE OR REPLACE FUNCTION public.generate_league_playoffs(_season_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _size int;
  _all_done boolean;
  _seeds uuid[];
  _final_id uuid;
  _semi1 uuid;
  _semi2 uuid;
  _created int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT (generated_format->>'playoff_size')::int INTO _size
   FROM public.league_seasons WHERE id = _season_id;
  IF _size IS NULL THEN
    RAISE EXCEPTION 'Format not generated';
  END IF;

  SELECT NOT EXISTS(
    SELECT 1 FROM public.matches
     WHERE season_id = _season_id AND stage = 'regular_season'
       AND result_status <> 'completed'
  ) INTO _all_done;

  IF NOT _all_done THEN
    RAISE EXCEPTION 'Regular season not complete';
  END IF;

  PERFORM public.recalculate_league_standings(_season_id);

  SELECT array_agg(s.team_id ORDER BY s.position ASC)
    INTO _seeds
    FROM public.league_standings s
    JOIN public.league_divisions d ON d.id = s.division_id
   WHERE d.season_id = _season_id
   LIMIT _size;

  IF array_length(_seeds,1) < 2 THEN
    RAISE EXCEPTION 'Not enough teams for playoffs';
  END IF;

  -- Top 2 = single final
  IF _size = 2 THEN
    INSERT INTO public.matches(
      season_id, matchday, stage, team_a_id, team_b_id,
      status, result_status, game, kind, bo_format, bracket_position
    ) VALUES (
      _season_id, 1000, 'playoff_final', _seeds[1], _seeds[2],
      'pending','scheduled','valorant','league','BO3', 1
    );
    _created := 1;
  -- Top 4
  ELSIF _size = 4 THEN
    INSERT INTO public.matches(
      season_id, matchday, stage, team_a_id, team_b_id,
      status, result_status, game, kind, bo_format, bracket_position
    ) VALUES (
      _season_id, 1000, 'playoff_final', NULL, NULL,
      'pending','scheduled','valorant','league','BO3', 1
    ) RETURNING id INTO _final_id;

    INSERT INTO public.matches(
      season_id, matchday, stage, team_a_id, team_b_id,
      status, result_status, game, kind, bo_format,
      bracket_position, next_match_id, next_match_slot
    ) VALUES (
      _season_id, 999, 'playoff_semi', _seeds[1], _seeds[4],
      'pending','scheduled','valorant','league','BO3', 1, _final_id, 'a'
    );
    INSERT INTO public.matches(
      season_id, matchday, stage, team_a_id, team_b_id,
      status, result_status, game, kind, bo_format,
      bracket_position, next_match_id, next_match_slot
    ) VALUES (
      _season_id, 999, 'playoff_semi', _seeds[2], _seeds[3],
      'pending','scheduled','valorant','league','BO3', 2, _final_id, 'b'
    );
    _created := 3;
  ELSE
    -- Top 6+: simplified — top 2 bye, seeds 3v6 and 4v5 in QF, winners face top 2 in semis
    -- Minimal implementation: just creates a final placeholder; admin can extend later.
    INSERT INTO public.matches(
      season_id, matchday, stage, team_a_id, team_b_id,
      status, result_status, game, kind, bo_format, bracket_position
    ) VALUES (
      _season_id, 1000, 'playoff_final', NULL, NULL,
      'pending','scheduled','valorant','league','BO3', 1
    );
    _created := 1;
  END IF;

  UPDATE public.league_seasons
     SET status = 'playoffs', playoffs_started_at = now(), updated_at = now()
   WHERE id = _season_id;

  RETURN _created;
END;
$$;

-- ============== 10. RPC: captain result flow ==============
CREATE OR REPLACE FUNCTION public.submit_match_result(
  _match_id uuid, _score_a int, _score_b int, _rounds_a int, _rounds_b int, _proof_url text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record; _opp uuid;
BEGIN
  SELECT * INTO _m FROM public.matches WHERE id = _match_id;
  IF _m IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF _m.result_status = 'completed' THEN RAISE EXCEPTION 'Already completed'; END IF;

  IF is_team_captain(auth.uid(), _m.team_a_id) THEN
    _opp := _m.team_b_id;
  ELSIF is_team_captain(auth.uid(), _m.team_b_id) THEN
    _opp := _m.team_a_id;
  ELSE
    RAISE EXCEPTION 'Only team captains can submit results';
  END IF;

  UPDATE public.matches
     SET score_a = _score_a, score_b = _score_b,
         rounds_a = _rounds_a, rounds_b = _rounds_b,
         proof_url = COALESCE(_proof_url, proof_url),
         result_status = 'pending_confirmation',
         confirmation_team_id = _opp,
         submitted_by = auth.uid(),
         submitted_at = now(),
         reported_by_user_id = auth.uid()
   WHERE id = _match_id;
END; $$;

CREATE OR REPLACE FUNCTION public.confirm_match_result(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record; _winner uuid; _next record;
BEGIN
  SELECT * INTO _m FROM public.matches WHERE id = _match_id;
  IF _m IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF _m.result_status <> 'pending_confirmation' THEN
    RAISE EXCEPTION 'Match is not pending confirmation';
  END IF;
  IF NOT is_team_captain(auth.uid(), _m.confirmation_team_id) THEN
    RAISE EXCEPTION 'Only the opposing captain can confirm';
  END IF;

  _winner := CASE WHEN _m.score_a > _m.score_b THEN _m.team_a_id
                  WHEN _m.score_b > _m.score_a THEN _m.team_b_id
                  ELSE NULL END;

  UPDATE public.matches
     SET result_status = 'completed', status = 'completed',
         winner_id = _winner, confirmed_at = now(),
         confirmed_by = auth.uid(), played_at = COALESCE(played_at, now())
   WHERE id = _match_id;

  -- Advance bracket
  IF _m.next_match_id IS NOT NULL AND _winner IS NOT NULL THEN
    IF _m.next_match_slot = 'a' THEN
      UPDATE public.matches SET team_a_id = _winner WHERE id = _m.next_match_id;
    ELSIF _m.next_match_slot = 'b' THEN
      UPDATE public.matches SET team_b_id = _winner WHERE id = _m.next_match_id;
    END IF;
  END IF;

  IF _m.season_id IS NOT NULL THEN
    PERFORM public.recalculate_league_standings(_m.season_id);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.dispute_match_result(_match_id uuid, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record; _team uuid; _id uuid;
BEGIN
  SELECT * INTO _m FROM public.matches WHERE id = _match_id;
  IF _m IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;

  IF is_team_captain(auth.uid(), _m.team_a_id) THEN _team := _m.team_a_id;
  ELSIF is_team_captain(auth.uid(), _m.team_b_id) THEN _team := _m.team_b_id;
  ELSE RAISE EXCEPTION 'Only captains can dispute'; END IF;

  INSERT INTO public.match_disputes(match_id, opened_by, opened_by_team_id, reason, status)
  VALUES (_match_id, auth.uid(), _team, _reason, 'open')
  RETURNING id INTO _id;

  UPDATE public.matches
     SET result_status = 'disputed', dispute_status = 'open', dispute_reason = _reason
   WHERE id = _match_id;
  RETURN _id;
END; $$;

-- ============== 11. RPC: admin overrides ==============
CREATE OR REPLACE FUNCTION public.admin_force_complete_match(
  _match_id uuid, _score_a int, _score_b int, _rounds_a int, _rounds_b int
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record; _winner uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT * INTO _m FROM public.matches WHERE id = _match_id;
  _winner := CASE WHEN _score_a > _score_b THEN _m.team_a_id
                  WHEN _score_b > _score_a THEN _m.team_b_id ELSE NULL END;
  UPDATE public.matches
     SET score_a = _score_a, score_b = _score_b,
         rounds_a = _rounds_a, rounds_b = _rounds_b,
         result_status = 'completed', status = 'completed',
         winner_id = _winner, confirmed_at = now(),
         confirmed_by = auth.uid(), played_at = COALESCE(played_at, now()),
         dispute_status = NULL
   WHERE id = _match_id;

  IF _m.next_match_id IS NOT NULL AND _winner IS NOT NULL THEN
    IF _m.next_match_slot = 'a' THEN
      UPDATE public.matches SET team_a_id = _winner WHERE id = _m.next_match_id;
    ELSIF _m.next_match_slot = 'b' THEN
      UPDATE public.matches SET team_b_id = _winner WHERE id = _m.next_match_id;
    END IF;
  END IF;
  IF _m.season_id IS NOT NULL THEN
    PERFORM public.recalculate_league_standings(_m.season_id);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_void_match(_match_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _m FROM public.matches WHERE id = _match_id;
  UPDATE public.matches
     SET result_status = 'voided', status = 'voided',
         winner_id = NULL, admin_note = _note
   WHERE id = _match_id;
  IF _m.season_id IS NOT NULL THEN
    PERFORM public.recalculate_league_standings(_m.season_id);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_resolve_dispute(
  _dispute_id uuid, _resolution text, _note text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d record;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT * INTO _d FROM public.match_disputes WHERE id = _dispute_id;
  UPDATE public.match_disputes
     SET status = _resolution, resolution_note = _note,
         resolved_by = auth.uid(), resolved_at = now()
   WHERE id = _dispute_id;
  UPDATE public.matches
     SET dispute_status = _resolution
   WHERE id = _d.match_id;
END; $$;
