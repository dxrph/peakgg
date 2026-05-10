
-- ============================================================
-- Validate team_join_requests on insert (one-team-per-game rule)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_team_join_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _game text;
  _existing_team_name text;
BEGIN
  SELECT game INTO _game FROM public.teams WHERE id = NEW.team_id;

  -- Already a member of this exact team
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = NEW.team_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this team' USING ERRCODE = 'P0001';
  END IF;

  -- Already in another active (non-demo) team for the same game
  SELECT t.name INTO _existing_team_name
  FROM public.team_members tm
  JOIN public.teams t ON t.id = tm.team_id
  WHERE tm.user_id = NEW.user_id
    AND t.game = _game
    AND t.is_demo = false
    AND t.id <> NEW.team_id
  LIMIT 1;

  IF _existing_team_name IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in a % team (%)', upper(_game), _existing_team_name USING ERRCODE = 'P0001';
  END IF;

  -- Pending application for the same team
  IF EXISTS (
    SELECT 1 FROM public.team_join_requests
    WHERE team_id = NEW.team_id
      AND user_id = NEW.user_id
      AND status = 'pending'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'You already have a pending application for this team' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS validate_team_join_request_trg ON public.team_join_requests;
CREATE TRIGGER validate_team_join_request_trg
BEFORE INSERT ON public.team_join_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_team_join_request();

-- ============================================================
-- Open Cup matchmaking RPCs (1v1 beta)
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_open_cup_queue(_game text, _team_size int DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _opponent uuid;
  _match_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to join the queue' USING ERRCODE = 'P0001';
  END IF;
  IF _team_size <> 1 THEN
    RAISE EXCEPTION 'Only the 1v1 Test Queue is open during the public beta' USING ERRCODE = 'P0001';
  END IF;

  -- Active open cup match already?
  IF EXISTS (
    SELECT 1 FROM public.matches
    WHERE kind = 'open_cup'
      AND status NOT IN ('completed','cancelled')
      AND (player_a_id = _uid OR player_b_id = _uid)
  ) THEN
    RAISE EXCEPTION 'You already have an active Open Cup match' USING ERRCODE = 'P0001';
  END IF;

  -- Already queued
  IF EXISTS (SELECT 1 FROM public.open_cup_queue WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'You are already in the queue' USING ERRCODE = 'P0001';
  END IF;

  -- Look for an opponent
  SELECT user_id INTO _opponent
  FROM public.open_cup_queue
  WHERE game = _game
    AND team_size = 1
    AND user_id <> _uid
  ORDER BY joined_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF _opponent IS NOT NULL THEN
    DELETE FROM public.open_cup_queue WHERE user_id = _opponent;

    INSERT INTO public.matches (game, kind, status, result_status, player_a_id, player_b_id, scheduled_at, played_at)
    VALUES (_game, 'open_cup', 'live', 'scheduled', _opponent, _uid, now(), now())
    RETURNING id INTO _match_id;

    INSERT INTO public.notifications (user_id, type, title, message, action_url, entity_id, entity_type)
    VALUES
      (_opponent, 'match_found', 'Open Cup match found', 'Your 1v1 Open Cup match is ready', '/matches/' || _match_id, _match_id, 'match'),
      (_uid,      'match_found', 'Open Cup match found', 'Your 1v1 Open Cup match is ready', '/matches/' || _match_id, _match_id, 'match');

    RETURN jsonb_build_object('status', 'matched', 'match_id', _match_id);
  END IF;

  INSERT INTO public.open_cup_queue (user_id, game, team_size) VALUES (_uid, _game, 1);
  RETURN jsonb_build_object('status', 'queued');
END $$;

CREATE OR REPLACE FUNCTION public.cancel_open_cup_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.open_cup_queue WHERE user_id = auth.uid();
END $$;

GRANT EXECUTE ON FUNCTION public.join_open_cup_queue(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_open_cup_queue() TO authenticated;
