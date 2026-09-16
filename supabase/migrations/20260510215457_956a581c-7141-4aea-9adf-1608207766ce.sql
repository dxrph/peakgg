-- Fix competitive queue match creation: no synthetic team IDs for temporary queue matches.

CREATE OR REPLACE FUNCTION public.join_open_cup_queue(_game text, _team_size integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _match_id uuid;
  _needed integer;
  _queued_count integer;
  _picked uuid[];
  _player_a uuid;
  _player_b uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to join the queue' USING ERRCODE = 'P0001';
  END IF;
  IF _team_size IS NULL OR _team_size < 1 OR _team_size > 5 THEN
    RAISE EXCEPTION 'Invalid team size' USING ERRCODE = 'P0001';
  END IF;
  _needed := _team_size * 2;

  IF EXISTS (
    SELECT 1
    FROM public.matches m
    LEFT JOIN public.match_rosters mr ON mr.match_id = m.id AND mr.user_id = _uid
    WHERE m.kind IN ('open_cup','ranked')
      AND m.status NOT IN ('completed','cancelled')
      AND (m.player_a_id = _uid OR m.player_b_id = _uid OR mr.user_id = _uid)
  ) THEN
    RAISE EXCEPTION 'You already have an active competitive match' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (SELECT 1 FROM public.open_cup_queue WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'You are already in the queue' USING ERRCODE = 'P0001';
  END IF;

  SELECT array_agg(user_id)
  INTO _picked
  FROM (
    SELECT user_id
    FROM public.open_cup_queue
    WHERE game = _game
      AND team_size = _team_size
      AND user_id <> _uid
    ORDER BY joined_at ASC
    LIMIT (_needed - 1)
    FOR UPDATE SKIP LOCKED
  ) q;

  _queued_count := COALESCE(array_length(_picked, 1), 0);

  IF _queued_count < (_needed - 1) THEN
    INSERT INTO public.open_cup_queue (user_id, game, team_size)
    VALUES (_uid, _game, _team_size);
    RETURN jsonb_build_object('status', 'queued');
  END IF;

  DELETE FROM public.open_cup_queue WHERE user_id = ANY(_picked);

  IF _team_size = 1 THEN
    _player_a := _picked[1];
    _player_b := _uid;

    INSERT INTO public.matches (
      game, kind, status, result_status,
      team_a_id, team_b_id,
      player_a_id, player_b_id,
      scheduled_at, played_at
    )
    VALUES (
      _game, 'open_cup', 'live', 'scheduled',
      NULL, NULL,
      _player_a, _player_b,
      now(), now()
    )
    RETURNING id INTO _match_id;

    INSERT INTO public.match_rosters (match_id, team_id, user_id, role, side, joined_from, is_fill)
    VALUES
      (_match_id, NULL, _player_a, 'starter', 'A', 'solo', false),
      (_match_id, NULL, _player_b, 'starter', 'B', 'solo', false);
  ELSE
    INSERT INTO public.matches (
      game, kind, status, result_status,
      team_a_id, team_b_id,
      scheduled_at, played_at
    )
    VALUES (
      _game, 'open_cup', 'live', 'scheduled',
      NULL, NULL,
      now(), now()
    )
    RETURNING id INTO _match_id;

    INSERT INTO public.match_rosters (match_id, team_id, user_id, role, side, joined_from, is_fill)
    SELECT
      _match_id,
      NULL,
      user_id,
      'starter',
      CASE
        WHEN ((rn - 1) / 2) % 2 = 0 THEN
          CASE WHEN (rn % 2) = 1 THEN 'A' ELSE 'B' END
        ELSE
          CASE WHEN (rn % 2) = 1 THEN 'B' ELSE 'A' END
      END AS side,
      'solo',
      false
    FROM (
      SELECT au.user_id,
             COALESCE(ps.elo, 0) AS elo,
             row_number() OVER (ORDER BY COALESCE(ps.elo, 0) DESC, au.user_id) AS rn
      FROM (
        SELECT _uid AS user_id
        UNION ALL
        SELECT unnest(_picked) AS user_id
      ) au
      LEFT JOIN public.player_stats ps
        ON ps.user_id = au.user_id AND ps.game = _game
    ) ranked;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT mr.user_id, 'match_found', 'Open Cup match found',
         'Your ' || _team_size || 'v' || _team_size || ' Open Cup match is ready',
         '/matches/' || _match_id, _match_id, 'match'
  FROM public.match_rosters mr
  WHERE mr.match_id = _match_id;

  RETURN jsonb_build_object('status', 'matched', 'match_id', _match_id);
END
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_solo(_mode text, _game text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_team_size integer;
  v_result jsonb;
  v_match_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'You must be signed in to join the queue'; END IF;
  IF _mode NOT IN ('open_cup','ranked') THEN RAISE EXCEPTION 'Invalid mode'; END IF;

  SELECT COALESCE((value->>'team_size')::int, 1) INTO v_team_size
  FROM platform_settings WHERE key = 'competitive_queue_config';
  IF v_team_size IS NULL THEN v_team_size := 1; END IF;

  IF EXISTS (
    SELECT 1 FROM competitive_queue_groups g
    JOIN competitive_queue_group_members m ON m.group_id = g.id
    WHERE m.user_id = v_uid AND g.status = 'queued'
  ) OR EXISTS (SELECT 1 FROM public.open_cup_queue WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'You are already in a queue';
  END IF;

  INSERT INTO competitive_queue_groups (mode, game, created_by, source, desired_team_size, current_party_size)
  VALUES (_mode, _game, v_uid, 'solo', v_team_size, 1)
  RETURNING id INTO v_group_id;

  INSERT INTO competitive_queue_group_members (group_id, user_id, role)
  VALUES (v_group_id, v_uid, 'captain');

  BEGIN
    v_result := join_open_cup_queue(_game, v_team_size);
  EXCEPTION WHEN OTHERS THEN
    UPDATE competitive_queue_groups SET status='cancelled', updated_at=now() WHERE id = v_group_id;
    DELETE FROM public.open_cup_queue WHERE user_id = v_uid;
    RAISE EXCEPTION 'Could not create match. Please try again or contact support.' USING ERRCODE = 'P0001';
  END;

  IF v_result->>'status' = 'matched' THEN
    v_match_id := (v_result->>'match_id')::uuid;
    UPDATE competitive_queue_groups
       SET status='matched', match_id=v_match_id, updated_at=now()
     WHERE id = v_group_id;

    UPDATE competitive_queue_groups g
       SET status='matched', match_id=v_match_id, updated_at=now()
      FROM competitive_queue_group_members gm
      JOIN match_rosters mr ON mr.user_id = gm.user_id
     WHERE gm.group_id = g.id
       AND mr.match_id = v_match_id
       AND g.status = 'queued';

    UPDATE match_rosters mr
       SET joined_from = COALESCE(mr.joined_from, 'solo'),
           is_fill = COALESCE(mr.is_fill, false),
           queue_group_id = COALESCE(mr.queue_group_id, g.id)
      FROM competitive_queue_group_members gm
      JOIN competitive_queue_groups g ON g.id = gm.group_id
     WHERE mr.match_id = v_match_id
       AND gm.user_id = mr.user_id
       AND g.match_id = v_match_id;
  END IF;

  RETURN jsonb_build_object('status', v_result->>'status',
                            'match_id', v_result->>'match_id',
                            'group_id', v_group_id,
                            'mode', _mode);
END
$function$;

CREATE OR REPLACE FUNCTION public.cancel_open_cup_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.open_cup_queue WHERE user_id = auth.uid();
  UPDATE public.competitive_queue_groups g
     SET status = 'cancelled', updated_at = now()
    FROM public.competitive_queue_group_members m
   WHERE m.group_id = g.id
     AND m.user_id = auth.uid()
     AND g.status = 'queued';
END
$function$;

CREATE OR REPLACE FUNCTION public.submit_open_cup_result(_match_id uuid, _score_a integer, _score_b integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  m record;
  v_uid uuid := auth.uid();
  v_my_side text;
  v_my_team uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind NOT IN ('open_cup','ranked') THEN RAISE EXCEPTION 'Not a queue match'; END IF;
  IF m.result_status NOT IN ('scheduled','live','awaiting_result') THEN
    RAISE EXCEPTION 'Match not in submittable state';
  END IF;

  SELECT side, team_id INTO v_my_side, v_my_team
  FROM match_rosters WHERE match_id = _match_id AND user_id = v_uid LIMIT 1;

  IF v_my_side IS NULL AND v_my_team IS NULL THEN
    IF v_uid <> m.player_a_id AND v_uid <> m.player_b_id THEN
      RAISE EXCEPTION 'Only participants can submit';
    END IF;
  END IF;

  UPDATE matches SET
    score_a = _score_a, score_b = _score_b,
    result_status = 'pending_confirmation',
    submitted_by = v_uid,
    submitted_at = now()
  WHERE id = _match_id;

  INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT mr.user_id, 'match_result_pending', 'Confirm match result',
         'Your opponent submitted a result — please confirm',
         '/matches/' || _match_id, _match_id, 'match'
  FROM match_rosters mr
  WHERE mr.match_id = _match_id
    AND mr.user_id <> v_uid
    AND (
      (v_my_side IS NOT NULL AND mr.side IS DISTINCT FROM v_my_side)
      OR (v_my_side IS NULL AND v_my_team IS NOT NULL AND mr.team_id <> v_my_team)
    );

  IF v_my_side IS NULL AND v_my_team IS NULL AND m.player_a_id IS NOT NULL AND m.player_b_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
    VALUES (
      CASE WHEN v_uid = m.player_a_id THEN m.player_b_id ELSE m.player_a_id END,
      'match_result_pending', 'Confirm match result',
      'Your opponent submitted a result — please confirm',
      '/matches/' || _match_id, _match_id, 'match'
    );
  END IF;
END
$function$;

CREATE OR REPLACE FUNCTION public.confirm_open_cup_result(_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  m record;
  v_uid uuid := auth.uid();
  v_winner uuid;
  v_winner_side text;
  v_my_side text;
  v_sub_side text;
  v_my_team uuid;
  v_sub_team uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id FOR UPDATE;
  IF m IS NULL OR m.kind NOT IN ('open_cup','ranked') THEN RAISE EXCEPTION 'Not a queue match'; END IF;
  IF m.result_status <> 'pending_confirmation' THEN RAISE EXCEPTION 'Nothing to confirm'; END IF;
  IF v_uid = m.submitted_by THEN RAISE EXCEPTION 'Opposing side must confirm'; END IF;

  SELECT side, team_id INTO v_my_side, v_my_team
  FROM match_rosters WHERE match_id = _match_id AND user_id = v_uid LIMIT 1;

  IF v_my_side IS NOT NULL THEN
    SELECT side INTO v_sub_side
    FROM match_rosters WHERE match_id = _match_id AND user_id = m.submitted_by LIMIT 1;
    IF v_sub_side IS NOT NULL AND v_sub_side = v_my_side THEN
      RAISE EXCEPTION 'Opposing side must confirm';
    END IF;
    v_winner_side := CASE WHEN m.score_a > m.score_b THEN 'A'
                          WHEN m.score_b > m.score_a THEN 'B'
                          ELSE NULL END;
    IF v_winner_side IS NOT NULL THEN
      SELECT user_id INTO v_winner
      FROM match_rosters
      WHERE match_id = _match_id AND side = v_winner_side
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
  ELSIF v_my_team IS NOT NULL THEN
    SELECT team_id INTO v_sub_team
    FROM match_rosters WHERE match_id = _match_id AND user_id = m.submitted_by LIMIT 1;
    IF v_sub_team IS NOT NULL AND v_sub_team = v_my_team THEN
      RAISE EXCEPTION 'Opposing side must confirm';
    END IF;
    v_winner := CASE WHEN m.score_a > m.score_b THEN m.team_a_id
                     WHEN m.score_b > m.score_a THEN m.team_b_id
                     ELSE NULL END;
  ELSIF m.player_a_id IS NOT NULL OR m.player_b_id IS NOT NULL THEN
    IF v_uid <> m.player_a_id AND v_uid <> m.player_b_id THEN
      RAISE EXCEPTION 'Only participants can confirm';
    END IF;
    v_winner := CASE WHEN m.score_a > m.score_b THEN COALESCE(m.team_a_id, m.player_a_id)
                     WHEN m.score_b > m.score_a THEN COALESCE(m.team_b_id, m.player_b_id)
                     ELSE NULL END;
  ELSE
    RAISE EXCEPTION 'Only participants can confirm';
  END IF;

  UPDATE matches SET
    result_status='confirmed', status='completed', winner_id=v_winner,
    confirmed_by=v_uid, confirmed_at=now(), played_at=COALESCE(played_at, now())
  WHERE id=_match_id;

  INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT mr.user_id, 'match_completed', 'Match completed', 'Result confirmed',
         '/matches/' || _match_id, _match_id, 'match'
  FROM match_rosters mr
  WHERE mr.match_id = _match_id;

  IF NOT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id)
     AND m.player_a_id IS NOT NULL AND m.player_b_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
    VALUES
      (m.player_a_id, 'match_completed', 'Match completed', 'Result confirmed', '/matches/' || _match_id, _match_id, 'match'),
      (m.player_b_id, 'match_completed', 'Match completed', 'Result confirmed', '/matches/' || _match_id, _match_id, 'match');
  END IF;
END
$function$;

CREATE OR REPLACE FUNCTION public.admin_resolve_open_cup_match(_match_id uuid, _score_a integer, _score_b integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  m record;
  v_winner uuid;
  v_winner_side text;
  v_has_side_rosters boolean;
  v_has_rosters boolean;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Staff only';
  END IF;
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind NOT IN ('open_cup','ranked') THEN RAISE EXCEPTION 'Not a queue match'; END IF;

  SELECT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id AND side IS NOT NULL) INTO v_has_side_rosters;
  SELECT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id) INTO v_has_rosters;

  IF v_has_side_rosters THEN
    v_winner_side := CASE WHEN _score_a > _score_b THEN 'A'
                          WHEN _score_b > _score_a THEN 'B'
                          ELSE NULL END;
    IF v_winner_side IS NOT NULL THEN
      SELECT user_id INTO v_winner
      FROM match_rosters
      WHERE match_id = _match_id AND side = v_winner_side
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
  ELSIF v_has_rosters THEN
    v_winner := CASE WHEN _score_a > _score_b THEN m.team_a_id
                     WHEN _score_b > _score_a THEN m.team_b_id
                     ELSE NULL END;
  ELSIF m.player_a_id IS NOT NULL OR m.player_b_id IS NOT NULL THEN
    v_winner := CASE WHEN _score_a > _score_b THEN COALESCE(m.team_a_id, m.player_a_id)
                     WHEN _score_b > _score_a THEN COALESCE(m.team_b_id, m.player_b_id)
                     ELSE NULL END;
  ELSE
    v_winner := CASE WHEN _score_a > _score_b THEN m.team_a_id
                     WHEN _score_b > _score_a THEN m.team_b_id
                     ELSE NULL END;
  END IF;

  UPDATE matches SET score_a=_score_a, score_b=_score_b, winner_id=v_winner,
    result_status='admin_resolved', status='completed',
    confirmed_by=auth.uid(), confirmed_at=now(),
    played_at=COALESCE(played_at, now())
  WHERE id=_match_id;
END
$function$;

CREATE OR REPLACE FUNCTION public.dispute_match_result(_match_id uuid, _reason text, _evidence text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  m record;
  v_team uuid;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;

  IF m.kind IN ('open_cup','ranked') THEN
    SELECT COALESCE(team_id, user_id) INTO v_team FROM match_rosters
      WHERE match_id = _match_id AND user_id = v_uid LIMIT 1;
    IF v_team IS NULL THEN
      IF v_uid = m.player_a_id THEN v_team := COALESCE(m.team_a_id, m.player_a_id);
      ELSIF v_uid = m.player_b_id THEN v_team := COALESCE(m.team_b_id, m.player_b_id);
      ELSE RAISE EXCEPTION 'Only participants can dispute';
      END IF;
    END IF;
  ELSE
    IF is_team_captain(v_uid, m.team_a_id) THEN v_team := m.team_a_id;
    ELSIF is_team_captain(v_uid, m.team_b_id) THEN v_team := m.team_b_id;
    ELSE RAISE EXCEPTION 'Only captains can dispute'; END IF;
  END IF;

  INSERT INTO match_disputes (match_id, opened_by, opened_by_team_id, reason, evidence_url)
  VALUES (_match_id, v_uid, v_team, _reason, _evidence);
  UPDATE matches SET result_status='disputed' WHERE id=_match_id;
END
$function$;

GRANT EXECUTE ON FUNCTION public.join_open_cup_queue(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_solo(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_open_cup_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_open_cup_result(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_open_cup_result(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_open_cup_match(uuid, integer, integer) TO authenticated;