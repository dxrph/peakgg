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

    UPDATE matches
       SET kind = _mode
     WHERE id = v_match_id;

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

GRANT EXECUTE ON FUNCTION public.enqueue_solo(text, text) TO authenticated;