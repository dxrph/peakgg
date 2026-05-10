
-- 1v1-aware Open Cup submit
CREATE OR REPLACE FUNCTION public.submit_open_cup_result(_match_id uuid, _score_a int, _score_b int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m record;
  v_uid uuid := auth.uid();
  v_is_participant boolean := false;
  v_opponent uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;
  IF m.result_status NOT IN ('scheduled','live','awaiting_result') THEN
    RAISE EXCEPTION 'Match not in submittable state';
  END IF;

  IF m.player_a_id IS NOT NULL OR m.player_b_id IS NOT NULL THEN
    v_is_participant := (v_uid = m.player_a_id OR v_uid = m.player_b_id);
    v_opponent := CASE WHEN v_uid = m.player_a_id THEN m.player_b_id ELSE m.player_a_id END;
  ELSE
    v_is_participant := EXISTS (
      SELECT 1 FROM match_rosters WHERE match_id = _match_id AND user_id = v_uid
    );
  END IF;

  IF NOT v_is_participant THEN RAISE EXCEPTION 'Only participants can submit'; END IF;

  UPDATE matches SET
    score_a = _score_a, score_b = _score_b,
    result_status = 'pending_confirmation',
    submitted_by = v_uid,
    submitted_at = now()
  WHERE id = _match_id;

  IF v_opponent IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
    VALUES (v_opponent, 'match_result_submitted', 'Result submitted',
            'Confirm or dispute the submitted result',
            '/matches/' || _match_id, _match_id, 'match');
  END IF;
END $$;

-- 1v1-aware Open Cup confirm
CREATE OR REPLACE FUNCTION public.confirm_open_cup_result(_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m record;
  v_uid uuid := auth.uid();
  v_winner uuid;
  v_team uuid;
  v_sub_team uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;
  IF m.result_status <> 'pending_confirmation' THEN RAISE EXCEPTION 'Nothing to confirm'; END IF;

  IF m.player_a_id IS NOT NULL OR m.player_b_id IS NOT NULL THEN
    IF v_uid <> m.player_a_id AND v_uid <> m.player_b_id THEN
      RAISE EXCEPTION 'Only participants can confirm';
    END IF;
    IF v_uid = m.submitted_by THEN RAISE EXCEPTION 'Opponent must confirm'; END IF;
    v_winner := CASE WHEN m.score_a > m.score_b THEN m.player_a_id
                     WHEN m.score_b > m.score_a THEN m.player_b_id
                     ELSE NULL END;
  ELSE
    SELECT team_id INTO v_team FROM match_rosters
      WHERE match_id = _match_id AND user_id = v_uid LIMIT 1;
    IF v_team IS NULL THEN RAISE EXCEPTION 'Only participants can confirm'; END IF;
    SELECT team_id INTO v_sub_team FROM match_rosters
      WHERE match_id = _match_id AND user_id = m.submitted_by LIMIT 1;
    IF v_team = v_sub_team THEN RAISE EXCEPTION 'Opposing side must confirm'; END IF;
    v_winner := CASE WHEN m.score_a > m.score_b THEN m.team_a_id
                     WHEN m.score_b > m.score_a THEN m.team_b_id
                     ELSE NULL END;
  END IF;

  UPDATE matches SET
    result_status='confirmed', status='completed', winner_id=v_winner,
    confirmed_by=v_uid, confirmed_at=now(), played_at=COALESCE(played_at, now())
  WHERE id=_match_id;

  -- Notify both players (1v1 only)
  IF m.player_a_id IS NOT NULL AND m.player_b_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
    VALUES
      (m.player_a_id, 'match_completed', 'Match completed', 'Result confirmed', '/matches/' || _match_id, _match_id, 'match'),
      (m.player_b_id, 'match_completed', 'Match completed', 'Result confirmed', '/matches/' || _match_id, _match_id, 'match');
  END IF;
END $$;

-- Admin resolve (1v1 aware)
CREATE OR REPLACE FUNCTION public.admin_resolve_open_cup_match(_match_id uuid, _score_a int, _score_b int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE m record; v_winner uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Staff only';
  END IF;
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;

  IF m.player_a_id IS NOT NULL OR m.player_b_id IS NOT NULL THEN
    v_winner := CASE WHEN _score_a > _score_b THEN m.player_a_id
                     WHEN _score_b > _score_a THEN m.player_b_id
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
END $$;
