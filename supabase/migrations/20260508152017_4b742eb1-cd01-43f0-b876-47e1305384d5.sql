
-- Peak League schema

-- Helper: is team captain (owner)
CREATE OR REPLACE FUNCTION public.is_team_captain(_user_id uuid, _team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teams WHERE id = _team_id AND owner_id = _user_id)
$$;

-- LEAGUES
CREATE TABLE public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  game text NOT NULL DEFAULT 'valorant',
  description text,
  rules_md text,
  reward_text text,
  banner_url text,
  status text NOT NULL DEFAULT 'draft',
  max_teams int NOT NULL DEFAULT 8,
  min_roster_size int NOT NULL DEFAULT 5,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Admins manage leagues" ON public.leagues FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_leagues_touch BEFORE UPDATE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LEAGUE SEASONS
CREATE TABLE public.league_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  name text NOT NULL,
  season_number int NOT NULL DEFAULT 0,
  format text NOT NULL DEFAULT 'round_robin',
  starts_at timestamptz,
  ends_at timestamptz,
  registration_deadline timestamptz,
  playoff_size int NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'draft',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.league_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads seasons" ON public.league_seasons FOR SELECT USING (true);
CREATE POLICY "Admins manage league seasons" ON public.league_seasons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_league_seasons_touch BEFORE UPDATE ON public.league_seasons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LEAGUE DIVISIONS
CREATE TABLE public.league_divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.league_seasons(id) ON DELETE CASCADE,
  name text NOT NULL,
  tier int NOT NULL DEFAULT 1,
  capacity int NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.league_divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads divisions" ON public.league_divisions FOR SELECT USING (true);
CREATE POLICY "Admins manage divisions" ON public.league_divisions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- LEAGUE REGISTRATIONS
CREATE TABLE public.league_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.league_seasons(id) ON DELETE CASCADE,
  division_id uuid REFERENCES public.league_divisions(id) ON DELETE SET NULL,
  team_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  submitted_by uuid NOT NULL,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, team_id)
);
ALTER TABLE public.league_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads registrations" ON public.league_registrations FOR SELECT USING (true);
CREATE POLICY "Captain creates registration" ON public.league_registrations FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid() AND is_team_captain(auth.uid(), team_id));
CREATE POLICY "Captain withdraws own registration" ON public.league_registrations FOR DELETE TO authenticated
  USING (is_team_captain(auth.uid(), team_id));
CREATE POLICY "Admins manage registrations" ON public.league_registrations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- LEAGUE STANDINGS
CREATE TABLE public.league_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES public.league_divisions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  played int NOT NULL DEFAULT 0,
  wins int NOT NULL DEFAULT 0,
  draws int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 0,
  round_diff int NOT NULL DEFAULT 0,
  form text[] NOT NULL DEFAULT '{}',
  position int,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(division_id, team_id)
);
ALTER TABLE public.league_standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads standings" ON public.league_standings FOR SELECT USING (true);
CREATE POLICY "Admins manage standings" ON public.league_standings FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Extend matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.league_seasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES public.league_divisions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS matchday int,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS result_status text DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS submitted_by uuid,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Allow captains to update league matches (for result workflow); restricted by RPCs in practice
CREATE POLICY "Captains update league matches" ON public.matches FOR UPDATE TO authenticated
  USING (
    season_id IS NOT NULL AND (
      is_team_captain(auth.uid(), team_a_id) OR is_team_captain(auth.uid(), team_b_id)
    )
  ) WITH CHECK (
    season_id IS NOT NULL AND (
      is_team_captain(auth.uid(), team_a_id) OR is_team_captain(auth.uid(), team_b_id)
    )
  );

-- MATCH RESULTS submitted by captains
CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  submitted_by_team_id uuid NOT NULL,
  submitted_by uuid NOT NULL,
  score_a int NOT NULL,
  score_b int NOT NULL,
  map text,
  notes text,
  screenshot_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads results" ON public.match_results FOR SELECT USING (true);
CREATE POLICY "Captain submits result" ON public.match_results FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid() AND is_team_captain(auth.uid(), submitted_by_team_id));

-- MATCH DISPUTES
CREATE TABLE public.match_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  opened_by_team_id uuid NOT NULL,
  reason text NOT NULL,
  evidence_url text,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.match_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads disputes" ON public.match_disputes FOR SELECT USING (true);
CREATE POLICY "Captain opens dispute" ON public.match_disputes FOR INSERT TO authenticated
  WITH CHECK (opened_by = auth.uid() AND is_team_captain(auth.uid(), opened_by_team_id));
CREATE POLICY "Admin resolves dispute" ON public.match_disputes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

-- MATCH ROSTERS
CREATE TABLE public.match_rosters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'starter',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id)
);
ALTER TABLE public.match_rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads rosters" ON public.match_rosters FOR SELECT USING (true);
CREATE POLICY "Captain manages rosters" ON public.match_rosters FOR ALL TO authenticated
  USING (is_team_captain(auth.uid(), team_id)) WITH CHECK (is_team_captain(auth.uid(), team_id));

-- COACH NOTES
CREATE TABLE public.coach_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  author_id uuid NOT NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  visibility text NOT NULL DEFAULT 'team',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read coach notes" ON public.coach_notes FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_id));
CREATE POLICY "Members write coach notes" ON public.coach_notes FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND is_team_member(auth.uid(), team_id));
CREATE POLICY "Author or captain deletes coach notes" ON public.coach_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_team_captain(auth.uid(), team_id));

-- TROPHIES
CREATE TABLE public.trophies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  season_id uuid REFERENCES public.league_seasons(id) ON DELETE SET NULL,
  kind text NOT NULL,
  label text,
  awarded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads trophies" ON public.trophies FOR SELECT USING (true);
CREATE POLICY "Admins manage trophies" ON public.trophies FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============== RPCs ==============

CREATE OR REPLACE FUNCTION public.register_team_for_season(_season_id uuid, _team_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text; v_min int; v_count int; v_div uuid; v_max int; v_reg_count int; v_reg_id uuid;
BEGIN
  IF NOT is_team_captain(auth.uid(), _team_id) THEN RAISE EXCEPTION 'Only the team captain can register'; END IF;
  SELECT s.status, l.min_roster_size, l.max_teams INTO v_status, v_min, v_max
  FROM league_seasons s JOIN leagues l ON l.id = s.league_id WHERE s.id = _season_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Season not found'; END IF;
  IF v_status <> 'registration_open' THEN RAISE EXCEPTION 'Registrations are closed'; END IF;
  SELECT COUNT(*) INTO v_count FROM team_members WHERE team_id = _team_id;
  IF v_count < v_min THEN RAISE EXCEPTION 'Roster too small (need %)', v_min; END IF;
  SELECT COUNT(*) INTO v_reg_count FROM league_registrations WHERE season_id = _season_id AND status IN ('pending','approved');
  IF v_reg_count >= v_max THEN RAISE EXCEPTION 'Season is full'; END IF;
  SELECT id INTO v_div FROM league_divisions WHERE season_id = _season_id ORDER BY tier ASC LIMIT 1;
  INSERT INTO league_registrations (season_id, division_id, team_id, status, submitted_by)
  VALUES (_season_id, v_div, _team_id, 'pending', auth.uid())
  RETURNING id INTO v_reg_id;
  RETURN v_reg_id;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_league_registration(_registration_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT * INTO r FROM league_registrations WHERE id = _registration_id;
  IF r IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  UPDATE league_registrations SET status = 'approved', decided_by = auth.uid(), decided_at = now() WHERE id = _registration_id;
  INSERT INTO league_standings (division_id, team_id) VALUES (r.division_id, r.team_id) ON CONFLICT DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.reject_league_registration(_registration_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE league_registrations SET status = 'rejected', decided_by = auth.uid(), decided_at = now() WHERE id = _registration_id;
END; $$;

CREATE OR REPLACE FUNCTION public.recompute_standings_for_division(_division_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; t record; pos int := 0;
BEGIN
  UPDATE league_standings SET played=0, wins=0, draws=0, losses=0, points=0, round_diff=0, form='{}', position=NULL
   WHERE division_id = _division_id;

  FOR r IN
    SELECT * FROM matches
    WHERE division_id = _division_id
      AND result_status IN ('confirmed','admin_resolved')
    ORDER BY scheduled_at NULLS LAST, created_at
  LOOP
    -- Team A
    UPDATE league_standings SET
      played = played + 1,
      wins = wins + CASE WHEN r.score_a > r.score_b THEN 1 ELSE 0 END,
      draws = draws + CASE WHEN r.score_a = r.score_b THEN 1 ELSE 0 END,
      losses = losses + CASE WHEN r.score_a < r.score_b THEN 1 ELSE 0 END,
      points = points + CASE WHEN r.score_a > r.score_b THEN 3 WHEN r.score_a = r.score_b THEN 1 ELSE 0 END,
      round_diff = round_diff + (COALESCE(r.score_a,0) - COALESCE(r.score_b,0)),
      form = (form || ARRAY[CASE WHEN r.score_a > r.score_b THEN 'W' WHEN r.score_a = r.score_b THEN 'D' ELSE 'L' END])
    WHERE division_id = _division_id AND team_id = r.team_a_id;

    UPDATE league_standings SET
      played = played + 1,
      wins = wins + CASE WHEN r.score_b > r.score_a THEN 1 ELSE 0 END,
      draws = draws + CASE WHEN r.score_a = r.score_b THEN 1 ELSE 0 END,
      losses = losses + CASE WHEN r.score_b < r.score_a THEN 1 ELSE 0 END,
      points = points + CASE WHEN r.score_b > r.score_a THEN 3 WHEN r.score_a = r.score_b THEN 1 ELSE 0 END,
      round_diff = round_diff + (COALESCE(r.score_b,0) - COALESCE(r.score_a,0)),
      form = (form || ARRAY[CASE WHEN r.score_b > r.score_a THEN 'W' WHEN r.score_a = r.score_b THEN 'D' ELSE 'L' END])
    WHERE division_id = _division_id AND team_id = r.team_b_id;
  END LOOP;

  -- Trim form to last 5
  UPDATE league_standings SET form = (SELECT array_agg(x) FROM (SELECT unnest(form) x OFFSET GREATEST(0, array_length(form,1)-5)) s)
   WHERE division_id = _division_id AND array_length(form,1) > 5;

  -- Set positions
  pos := 0;
  FOR t IN
    SELECT id FROM league_standings WHERE division_id = _division_id
    ORDER BY points DESC, round_diff DESC, wins DESC
  LOOP
    pos := pos + 1;
    UPDATE league_standings SET position = pos, updated_at = now() WHERE id = t.id;
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.submit_match_result(
  _match_id uuid, _score_a int, _score_b int, _map text DEFAULT NULL, _notes text DEFAULT NULL, _screenshot text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; v_team uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF m.result_status NOT IN ('scheduled','live','awaiting_result') THEN RAISE EXCEPTION 'Match not in submittable state'; END IF;
  IF is_team_captain(auth.uid(), m.team_a_id) THEN v_team := m.team_a_id;
  ELSIF is_team_captain(auth.uid(), m.team_b_id) THEN v_team := m.team_b_id;
  ELSE RAISE EXCEPTION 'Only captains can submit results'; END IF;
  INSERT INTO match_results (match_id, submitted_by_team_id, submitted_by, score_a, score_b, map, notes, screenshot_url)
  VALUES (_match_id, v_team, auth.uid(), _score_a, _score_b, _map, _notes, _screenshot);
  UPDATE matches SET
    score_a = _score_a, score_b = _score_b, map = COALESCE(_map, map),
    result_status = 'pending_confirmation', submitted_by = auth.uid(), submitted_at = now()
  WHERE id = _match_id;
END; $$;

CREATE OR REPLACE FUNCTION public.confirm_match_result(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; v_winner uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m.result_status <> 'pending_confirmation' THEN RAISE EXCEPTION 'Nothing to confirm'; END IF;
  -- confirmer must be captain of opposite team
  IF m.submitted_by IS NULL THEN RAISE EXCEPTION 'No submission'; END IF;
  IF is_team_captain(auth.uid(), m.team_a_id) AND is_team_captain(m.submitted_by, m.team_a_id) THEN
    RAISE EXCEPTION 'Opposing captain must confirm';
  END IF;
  IF NOT (is_team_captain(auth.uid(), m.team_a_id) OR is_team_captain(auth.uid(), m.team_b_id)) THEN
    RAISE EXCEPTION 'Only captains can confirm';
  END IF;
  v_winner := CASE WHEN m.score_a > m.score_b THEN m.team_a_id WHEN m.score_b > m.score_a THEN m.team_b_id ELSE NULL END;
  UPDATE matches SET result_status='confirmed', status='completed', winner_id=v_winner,
    confirmed_by=auth.uid(), confirmed_at=now(), played_at=COALESCE(played_at, now())
  WHERE id = _match_id;
  IF m.division_id IS NOT NULL THEN
    PERFORM recompute_standings_for_division(m.division_id);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.dispute_match_result(_match_id uuid, _reason text, _evidence text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; v_team uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF is_team_captain(auth.uid(), m.team_a_id) THEN v_team := m.team_a_id;
  ELSIF is_team_captain(auth.uid(), m.team_b_id) THEN v_team := m.team_b_id;
  ELSE RAISE EXCEPTION 'Only captains can dispute'; END IF;
  INSERT INTO match_disputes (match_id, opened_by, opened_by_team_id, reason, evidence_url)
  VALUES (_match_id, auth.uid(), v_team, _reason, _evidence);
  UPDATE matches SET result_status='disputed' WHERE id=_match_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_resolve_match(_match_id uuid, _score_a int, _score_b int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; v_winner uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'Staff only'; END IF;
  SELECT * INTO m FROM matches WHERE id=_match_id;
  v_winner := CASE WHEN _score_a > _score_b THEN m.team_a_id WHEN _score_b > _score_a THEN m.team_b_id ELSE NULL END;
  UPDATE matches SET score_a=_score_a, score_b=_score_b, winner_id=v_winner,
    result_status='admin_resolved', status='completed', confirmed_by=auth.uid(), confirmed_at=now(),
    played_at=COALESCE(played_at, now())
  WHERE id=_match_id;
  UPDATE match_disputes SET status='resolved', resolved_by=auth.uid(), resolved_at=now()
  WHERE match_id=_match_id AND status='open';
  IF m.division_id IS NOT NULL THEN PERFORM recompute_standings_for_division(m.division_id); END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_round_robin_fixtures(_season_id uuid, _start_date timestamptz, _days_between int DEFAULT 7)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_div uuid; v_game text; teams uuid[]; n int; rounds int; i int; j int; matchday int;
  rotated uuid[]; a uuid; b uuid; created int := 0;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT id INTO v_div FROM league_divisions WHERE season_id=_season_id ORDER BY tier ASC LIMIT 1;
  SELECT l.game INTO v_game FROM league_seasons s JOIN leagues l ON l.id=s.league_id WHERE s.id=_season_id;
  SELECT array_agg(team_id) INTO teams FROM league_registrations WHERE season_id=_season_id AND status='approved';
  IF teams IS NULL OR array_length(teams,1) < 2 THEN RAISE EXCEPTION 'Need at least 2 approved teams'; END IF;

  -- Delete existing scheduled league matches
  DELETE FROM matches WHERE season_id=_season_id AND result_status='scheduled';

  n := array_length(teams,1);
  IF n % 2 = 1 THEN teams := teams || ARRAY[NULL::uuid]; n := n+1; END IF;
  rounds := n - 1;

  rotated := teams;
  FOR matchday IN 1..rounds LOOP
    FOR i IN 1..(n/2) LOOP
      a := rotated[i];
      b := rotated[n - i + 1];
      IF a IS NOT NULL AND b IS NOT NULL THEN
        INSERT INTO matches (game, season_id, division_id, matchday, team_a_id, team_b_id,
          scheduled_at, result_status, status)
        VALUES (v_game, _season_id, v_div, matchday, a, b,
          _start_date + ((matchday-1) * (_days_between || ' days')::interval),
          'scheduled', 'pending');
        created := created + 1;
      END IF;
    END LOOP;
    -- rotate: keep first fixed, rotate rest
    rotated := ARRAY[rotated[1]] || ARRAY[rotated[n]] || rotated[2:n-1];
  END LOOP;
  RETURN created;
END; $$;

CREATE OR REPLACE FUNCTION public.award_season_trophies(_season_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  -- top 4 by standings of season's division
  FOR r IN
    SELECT ls.team_id, ls.position
    FROM league_standings ls
    JOIN league_divisions d ON d.id = ls.division_id
    WHERE d.season_id = _season_id AND ls.position <= 4
    ORDER BY ls.position
  LOOP
    INSERT INTO trophies (team_id, season_id, kind, label) VALUES (
      r.team_id, _season_id,
      CASE r.position WHEN 1 THEN 'champion' WHEN 2 THEN 'runner_up' ELSE 'semifinalist' END,
      CASE r.position WHEN 1 THEN '🏆 Champion' WHEN 2 THEN '🥈 Runner-up' ELSE '🥉 Semifinalist' END
    );
  END LOOP;
  UPDATE league_seasons SET status='completed' WHERE id=_season_id;
END; $$;

-- Realtime
ALTER TABLE public.league_standings REPLICA IDENTITY FULL;
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.league_standings;
