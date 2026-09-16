CREATE OR REPLACE FUNCTION public.admin_resolve_open_cup_match(
  _match_id uuid,
  _score_a integer,
  _score_b integer,
  _winner_user_id uuid DEFAULT NULL,
  _reason text DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  m record;
  v_winner uuid;
  v_winner_side text;
  v_has_side_rosters boolean;
  v_has_rosters boolean;
  v_resolution text;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Staff only';
  END IF;
  SELECT * INTO m FROM matches WHERE id = _match_id FOR UPDATE;
  IF m IS NULL OR m.kind NOT IN ('open_cup','ranked') THEN RAISE EXCEPTION 'Not a queue match'; END IF;
  IF _score_a IS NULL OR _score_b IS NULL OR _score_a < 0 OR _score_b < 0 THEN
    RAISE EXCEPTION 'Invalid score';
  END IF;

  SELECT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id AND side IS NOT NULL) INTO v_has_side_rosters;
  SELECT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id) INTO v_has_rosters;

  IF _winner_user_id IS NOT NULL THEN
    v_winner := _winner_user_id;
  ELSIF v_has_side_rosters THEN
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

  UPDATE matches SET
    score_a=_score_a, score_b=_score_b, winner_id=v_winner,
    result_status='admin_resolved', status='completed',
    confirmed_by=auth.uid(), confirmed_at=now(),
    played_at=COALESCE(played_at, now())
  WHERE id=_match_id;

  v_resolution := COALESCE(NULLIF(trim(concat_ws(' — ', _reason, _notes)), ''), 'Admin resolved');

  UPDATE match_disputes
     SET status = 'resolved',
         resolved_by = auth.uid(),
         resolved_at = now(),
         resolution_note = v_resolution
   WHERE match_id = _match_id AND status = 'open';

  INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT mr.user_id, 'match_admin_resolved', 'Match resolved by admin',
         COALESCE(v_resolution, 'An admin resolved your match'),
         '/matches/' || _match_id, _match_id, 'match'
  FROM match_rosters mr
  WHERE mr.match_id = _match_id;

  IF NOT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id)
     AND m.player_a_id IS NOT NULL AND m.player_b_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
    VALUES
      (m.player_a_id, 'match_admin_resolved', 'Match resolved by admin', COALESCE(v_resolution,'Resolved'), '/matches/' || _match_id, _match_id, 'match'),
      (m.player_b_id, 'match_admin_resolved', 'Match resolved by admin', COALESCE(v_resolution,'Resolved'), '/matches/' || _match_id, _match_id, 'match');
  END IF;
END
$function$;