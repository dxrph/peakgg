
-- 1) join_open_cup_queue: support any team size, always write match_rosters
CREATE OR REPLACE FUNCTION public.join_open_cup_queue(_game text, _team_size integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _match_id uuid;
  _side_a uuid := gen_random_uuid();
  _side_b uuid := gen_random_uuid();
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

  -- Active open cup match already?
  IF EXISTS (
    SELECT 1
    FROM public.matches m
    LEFT JOIN public.match_rosters mr ON mr.match_id = m.id AND mr.user_id = _uid
    WHERE m.kind = 'open_cup'
      AND m.status NOT IN ('completed','cancelled')
      AND (m.player_a_id = _uid OR m.player_b_id = _uid OR mr.user_id = _uid)
  ) THEN
    RAISE EXCEPTION 'You already have an active Open Cup match' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (SELECT 1 FROM public.open_cup_queue WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'You are already in the queue' USING ERRCODE = 'P0001';
  END IF;

  -- Try to gather (_needed - 1) other queued players
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
    -- Not enough players — enqueue
    INSERT INTO public.open_cup_queue (user_id, game, team_size)
    VALUES (_uid, _game, _team_size);
    RETURN jsonb_build_object('status', 'queued');
  END IF;

  -- Enough players — pop them and create the match
  DELETE FROM public.open_cup_queue WHERE user_id = ANY(_picked);

  -- Build full participant list including caller, sorted by ELO for snake-draft balance
  WITH all_users AS (
    SELECT u.user_id
    FROM (
      SELECT _uid AS user_id
      UNION ALL
      SELECT unnest(_picked) AS user_id
    ) u
  ),
  ranked AS (
    SELECT au.user_id,
           COALESCE(ps.elo, 0) AS elo,
           row_number() OVER (ORDER BY COALESCE(ps.elo, 0) DESC, au.user_id) AS rn
    FROM all_users au
    LEFT JOIN public.player_stats ps
      ON ps.user_id = au.user_id AND ps.game = _game
  )
  SELECT NULL INTO _player_a; -- placeholder, real assignment below
  -- We need to compute side assignments and collect IDs; do it via a temp CTE in a single insert.

  -- For team_size = 1, also set player_a_id/player_b_id for backwards compat.
  IF _team_size = 1 THEN
    -- Assign first picked as A, caller as B (matches old behavior of caller being on side B)
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
      _side_a, _side_b,
      _player_a, _player_b,
      now(), now()
    )
    RETURNING id INTO _match_id;

    INSERT INTO public.match_rosters (match_id, team_id, user_id, role)
    VALUES
      (_match_id, _side_a, _player_a, 'starter'),
      (_match_id, _side_b, _player_b, 'starter');
  ELSE
    -- 5v5 (or generic): snake-draft assignment
    INSERT INTO public.matches (
      game, kind, status, result_status,
      team_a_id, team_b_id,
      scheduled_at, played_at
    )
    VALUES (
      _game, 'open_cup', 'live', 'scheduled',
      _side_a, _side_b,
      now(), now()
    )
    RETURNING id INTO _match_id;

    INSERT INTO public.match_rosters (match_id, team_id, user_id, role)
    SELECT
      _match_id,
      CASE
        -- Snake draft: 1->A, 2->B, 3->B, 4->A, 5->A, 6->B, 7->B, 8->A, 9->A, 10->B
        WHEN ((rn - 1) / 2) % 2 = 0 THEN
          CASE WHEN (rn % 2) = 1 THEN _side_a ELSE _side_b END
        ELSE
          CASE WHEN (rn % 2) = 1 THEN _side_b ELSE _side_a END
      END AS team_id,
      user_id,
      'starter'
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

  -- Notify everyone
  INSERT INTO public.notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT mr.user_id, 'match_found', 'Open Cup match found',
         'Your ' || _team_size || 'v' || _team_size || ' Open Cup match is ready',
         '/matches/' || _match_id, _match_id, 'match'
  FROM public.match_rosters mr
  WHERE mr.match_id = _match_id;

  RETURN jsonb_build_object('status', 'matched', 'match_id', _match_id);
END
$function$;


-- 2) submit_open_cup_result: rosters-first
CREATE OR REPLACE FUNCTION public.submit_open_cup_result(_match_id uuid, _score_a integer, _score_b integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  m record;
  v_uid uuid := auth.uid();
  v_my_team uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;
  IF m.result_status NOT IN ('scheduled','live','awaiting_result') THEN
    RAISE EXCEPTION 'Match not in submittable state';
  END IF;

  -- Rosters-first
  SELECT team_id INTO v_my_team
  FROM match_rosters WHERE match_id = _match_id AND user_id = v_uid LIMIT 1;

  IF v_my_team IS NULL THEN
    -- Backwards compat: legacy 1v1 with only player_a/b
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

  -- Notify opposing side participants
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT mr.user_id, 'match_result_pending', 'Confirm match result',
         'Your opponent submitted a result — please confirm',
         '/matches/' || _match_id, _match_id, 'match'
  FROM match_rosters mr
  WHERE mr.match_id = _match_id
    AND mr.user_id <> v_uid
    AND (v_my_team IS NULL OR mr.team_id <> v_my_team);

  -- Legacy 1v1 fallback notification when no rosters
  IF v_my_team IS NULL AND m.player_a_id IS NOT NULL AND m.player_b_id IS NOT NULL THEN
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


-- 3) confirm_open_cup_result: rosters-first
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
  v_my_team uuid;
  v_sub_team uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id FOR UPDATE;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;
  IF m.result_status <> 'pending_confirmation' THEN RAISE EXCEPTION 'Nothing to confirm'; END IF;
  IF v_uid = m.submitted_by THEN RAISE EXCEPTION 'Opposing side must confirm'; END IF;

  -- Rosters-first
  SELECT team_id INTO v_my_team
  FROM match_rosters WHERE match_id = _match_id AND user_id = v_uid LIMIT 1;

  IF v_my_team IS NOT NULL THEN
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

  -- Notify all participants from rosters (covers both 1v1 and 5v5)
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
  SELECT mr.user_id, 'match_completed', 'Match completed', 'Result confirmed',
         '/matches/' || _match_id, _match_id, 'match'
  FROM match_rosters mr
  WHERE mr.match_id = _match_id;

  -- Legacy fallback when rosters absent
  IF NOT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id)
     AND m.player_a_id IS NOT NULL AND m.player_b_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_id, entity_type)
    VALUES
      (m.player_a_id, 'match_completed', 'Match completed', 'Result confirmed', '/matches/' || _match_id, _match_id, 'match'),
      (m.player_b_id, 'match_completed', 'Match completed', 'Result confirmed', '/matches/' || _match_id, _match_id, 'match');
  END IF;
END
$function$;


-- 4) admin_resolve_open_cup_match: rosters-first winner derivation
CREATE OR REPLACE FUNCTION public.admin_resolve_open_cup_match(_match_id uuid, _score_a integer, _score_b integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  m record;
  v_winner uuid;
  v_has_rosters boolean;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Staff only';
  END IF;
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;

  SELECT EXISTS (SELECT 1 FROM match_rosters WHERE match_id = _match_id) INTO v_has_rosters;

  IF v_has_rosters THEN
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


-- 5) Allow Open Cup participants (not only captains) to open disputes
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

  IF m.kind = 'open_cup' THEN
    -- Open Cup: any participant can dispute
    SELECT team_id INTO v_team FROM match_rosters
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


-- 6) Allow Open Cup participants to insert dispute rows (RLS)
DROP POLICY IF EXISTS "Open cup participant opens dispute" ON public.match_disputes;
CREATE POLICY "Open cup participant opens dispute"
ON public.match_disputes
FOR INSERT
TO authenticated
WITH CHECK (
  opened_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_disputes.match_id
      AND m.kind = 'open_cup'
      AND (
        EXISTS (SELECT 1 FROM match_rosters mr WHERE mr.match_id = m.id AND mr.user_id = auth.uid())
        OR m.player_a_id = auth.uid()
        OR m.player_b_id = auth.uid()
      )
  )
);


-- 7) Atomic claim helper for ELO processing
CREATE OR REPLACE FUNCTION public.claim_match_for_elo(_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_id uuid;
BEGIN
  UPDATE matches
  SET elo_processed_at = now()
  WHERE id = _match_id
    AND elo_processed_at IS NULL
    AND status = 'completed'
    AND winner_id IS NOT NULL
  RETURNING id INTO v_id;
  RETURN v_id IS NOT NULL;
END
$function$;
GRANT EXECUTE ON FUNCTION public.claim_match_for_elo(uuid) TO service_role;
