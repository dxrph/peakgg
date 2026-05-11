
CREATE OR REPLACE FUNCTION public.dispute_match_result(_match_id uuid, _reason text, _evidence text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  m record;
  v_team uuid;
  v_uid uuid := auth.uid();
  v_dispute_id uuid;
  v_short text;
  v_game text;
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
  VALUES (_match_id, v_uid, v_team, _reason, _evidence)
  RETURNING id INTO v_dispute_id;

  UPDATE matches SET result_status='disputed' WHERE id=_match_id;

  v_short := left(coalesce(_reason,''), 140);
  v_game := upper(coalesce(m.game,'match'));

  -- Notify all admins + moderators
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT ur.user_id, 'dispute_opened',
         'Match dispute opened',
         v_game || ' match disputed — reason: ' || COALESCE(NULLIF(v_short,''), 'no reason provided'),
         '/matches/' || _match_id, _match_id, 'match'
  FROM user_roles ur
  WHERE ur.role IN ('admin','moderator')
  ON CONFLICT DO NOTHING;

  -- Notify the opposing participants (open cup / ranked)
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT mr.user_id, 'match_disputed',
         'Match result disputed',
         'The opposing side opened a dispute. Awaiting admin resolution.',
         '/matches/' || _match_id, _match_id, 'match'
  FROM match_rosters mr
  WHERE mr.match_id = _match_id AND mr.user_id <> v_uid
  ON CONFLICT DO NOTHING;

  -- Fallback for legacy player_a/player_b matches with no rosters
  IF NOT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id)
     AND m.player_a_id IS NOT NULL AND m.player_b_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
    VALUES (
      CASE WHEN v_uid = m.player_a_id THEN m.player_b_id ELSE m.player_a_id END,
      'match_disputed', 'Match result disputed',
      'The opposing side opened a dispute. Awaiting admin resolution.',
      '/matches/' || _match_id, _match_id, 'match'
    );
  END IF;
END
$function$;

-- Backfill: notify admins about the existing stuck dispute(s) that had no notifications
INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
SELECT ur.user_id, 'dispute_opened',
       'Match dispute opened',
       upper(COALESCE(m.game,'match')) || ' match disputed — reason: ' || COALESCE(NULLIF(left(d.reason,140),''),'no reason provided'),
       '/matches/' || d.match_id, d.match_id, 'match'
FROM match_disputes d
JOIN matches m ON m.id = d.match_id
JOIN user_roles ur ON ur.role IN ('admin','moderator')
WHERE d.status = 'open'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = ur.user_id
      AND n.entity_id = d.match_id
      AND n.type = 'dispute_opened'
  );
