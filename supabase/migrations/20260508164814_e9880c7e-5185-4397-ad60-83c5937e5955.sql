
-- 1) Harden register_team_for_season with a duplicate check
CREATE OR REPLACE FUNCTION public.register_team_for_season(_season_id uuid, _team_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_status text; v_min int; v_count int; v_div uuid; v_max int; v_reg_count int; v_reg_id uuid;
  v_existing text;
BEGIN
  IF NOT is_team_captain(auth.uid(), _team_id) THEN RAISE EXCEPTION 'Only the team captain can register'; END IF;

  SELECT status INTO v_existing FROM league_registrations
   WHERE season_id = _season_id AND team_id = _team_id
   ORDER BY created_at DESC LIMIT 1;
  IF v_existing IN ('pending','approved') THEN
    RAISE EXCEPTION 'This team is already registered (%)', v_existing;
  END IF;

  SELECT s.status, l.min_roster_size, l.max_teams INTO v_status, v_min, v_max
  FROM league_seasons s JOIN leagues l ON l.id = s.league_id WHERE s.id = _season_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Season not found'; END IF;
  IF v_status <> 'registration_open' THEN RAISE EXCEPTION 'Registrations are closed'; END IF;

  SELECT COUNT(*) INTO v_count FROM team_members WHERE team_id = _team_id;
  IF v_count < v_min THEN RAISE EXCEPTION 'Roster too small (need % players, have %)', v_min, v_count; END IF;

  SELECT COUNT(*) INTO v_reg_count FROM league_registrations WHERE season_id = _season_id AND status IN ('pending','approved');
  IF v_reg_count >= v_max THEN RAISE EXCEPTION 'Season is full'; END IF;

  SELECT id INTO v_div FROM league_divisions WHERE season_id = _season_id ORDER BY tier ASC LIMIT 1;
  INSERT INTO league_registrations (season_id, division_id, team_id, status, submitted_by)
  VALUES (_season_id, v_div, _team_id, 'pending', auth.uid())
  RETURNING id INTO v_reg_id;
  RETURN v_reg_id;
END; $function$;

-- 2) Admin helper: seed N demo teams approved into the active season of a league
CREATE OR REPLACE FUNCTION public.seed_demo_teams_for_league(_league_id uuid, _count integer DEFAULT 8)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin uuid := auth.uid();
  v_season uuid; v_division uuid; v_game text; v_max int; v_existing int;
  i int; v_team uuid; v_created int := 0;
  v_names text[] := ARRAY['Phoenix','Vipers','Sentinels','Reapers','Storm','Titans','Wolves','Falcons','Dragons','Knights','Sharks','Comets'];
BEGIN
  IF NOT has_role(v_admin, 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT s.id, s.status, l.game, l.max_teams INTO v_season, v_game, v_game, v_max
  FROM league_seasons s JOIN leagues l ON l.id = s.league_id
  WHERE s.league_id = _league_id ORDER BY s.season_number DESC LIMIT 1;

  -- redo properly
  SELECT s.id INTO v_season FROM league_seasons s WHERE s.league_id = _league_id ORDER BY s.season_number DESC LIMIT 1;
  IF v_season IS NULL THEN RAISE EXCEPTION 'No season exists for this league'; END IF;
  SELECT l.game, l.max_teams INTO v_game, v_max FROM leagues l WHERE l.id = _league_id;
  SELECT id INTO v_division FROM league_divisions WHERE season_id = v_season ORDER BY tier ASC LIMIT 1;
  IF v_division IS NULL THEN RAISE EXCEPTION 'No division exists for this season'; END IF;

  SELECT COUNT(*) INTO v_existing FROM league_registrations
   WHERE season_id = v_season AND status IN ('pending','approved');

  FOR i IN 1.._count LOOP
    EXIT WHEN v_existing + v_created >= v_max;
    INSERT INTO teams (name, tag, owner_id, game, description, color)
    VALUES (
      '[DEMO] ' || v_names[((i-1) % array_length(v_names,1)) + 1] || ' ' || i,
      upper(left(v_names[((i-1) % array_length(v_names,1)) + 1], 3)),
      v_admin, v_game, 'Auto-seeded demo team for QA testing', '#ff4655'
    ) RETURNING id INTO v_team;

    INSERT INTO league_registrations (season_id, division_id, team_id, status, submitted_by, decided_by, decided_at)
    VALUES (v_season, v_division, v_team, 'approved', v_admin, v_admin, now())
    ON CONFLICT (season_id, team_id) DO NOTHING;

    INSERT INTO league_standings (division_id, team_id) VALUES (v_division, v_team)
    ON CONFLICT (division_id, team_id) DO NOTHING;

    v_created := v_created + 1;
  END LOOP;

  RETURN v_created;
END; $function$;

-- 3) Admin helper: wipe all [DEMO] teams owned by the caller
CREATE OR REPLACE FUNCTION public.wipe_demo_teams()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_admin uuid := auth.uid(); v_deleted int;
BEGIN
  IF NOT has_role(v_admin, 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  DELETE FROM teams WHERE owner_id = v_admin AND name LIKE '[DEMO]%';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END; $function$;
