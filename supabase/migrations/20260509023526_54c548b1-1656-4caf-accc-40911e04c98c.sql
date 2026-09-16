
-- 1) Matches: kind + ELO idempotency
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS elo_processed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_matches_kind ON public.matches(kind);

-- 2) Open Cup queue
CREATE TABLE IF NOT EXISTS public.open_cup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game text NOT NULL CHECK (game IN ('valorant','cs2','r6s')),
  team_size int NOT NULL DEFAULT 1 CHECK (team_size BETWEEN 1 AND 5),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.open_cup_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own queue entry" ON public.open_cup_queue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users insert own queue entry" ON public.open_cup_queue
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own queue entry" ON public.open_cup_queue
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- 3) Update chat access
CREATE OR REPLACE FUNCTION public.can_access_match_chat(_user_id uuid, _match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM matches m
    WHERE m.id = _match_id
      AND (
        is_team_member(_user_id, m.team_a_id)
        OR is_team_member(_user_id, m.team_b_id)
        OR EXISTS (SELECT 1 FROM match_rosters r WHERE r.match_id = _match_id AND r.user_id = _user_id)
      )
  ) OR has_role(_user_id, 'admin') OR has_role(_user_id, 'moderator');
$$;

-- 4) RPC: join queue (auto-creates match when full)
CREATE OR REPLACE FUNCTION public.join_open_cup_queue(_game text, _team_size int DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_active uuid;
  v_needed int;
  v_count int;
  v_picked uuid[];
  v_team_a uuid := gen_random_uuid();
  v_team_b uuid := gen_random_uuid();
  v_match_id uuid;
  i int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _game NOT IN ('valorant','cs2','r6s') THEN RAISE EXCEPTION 'Invalid game'; END IF;
  IF _team_size NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Invalid team size'; END IF;

  -- Already in an active Open Cup match?
  SELECT m.id INTO v_active
  FROM matches m
  JOIN match_rosters r ON r.match_id = m.id
  WHERE r.user_id = v_uid
    AND m.kind = 'open_cup'
    AND m.status NOT IN ('completed','cancelled')
  LIMIT 1;
  IF v_active IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in an active Open Cup match';
  END IF;

  INSERT INTO open_cup_queue (user_id, game, team_size)
  VALUES (v_uid, _game, _team_size)
  ON CONFLICT (user_id) DO UPDATE SET game = EXCLUDED.game, team_size = EXCLUDED.team_size, joined_at = now();

  v_needed := _team_size * 2;
  SELECT COUNT(*) INTO v_count FROM open_cup_queue WHERE game = _game AND team_size = _team_size;

  IF v_count < v_needed THEN
    RETURN jsonb_build_object('status','queued','queued', v_count, 'needed', v_needed);
  END IF;

  -- Pick oldest v_needed players atomically
  WITH picked AS (
    SELECT id, user_id FROM open_cup_queue
    WHERE game = _game AND team_size = _team_size
    ORDER BY joined_at ASC
    LIMIT v_needed
    FOR UPDATE SKIP LOCKED
  ), del AS (
    DELETE FROM open_cup_queue WHERE id IN (SELECT id FROM picked) RETURNING user_id
  )
  SELECT array_agg(user_id) INTO v_picked FROM del;

  IF v_picked IS NULL OR array_length(v_picked,1) < v_needed THEN
    RETURN jsonb_build_object('status','queued','queued', v_count, 'needed', v_needed);
  END IF;

  INSERT INTO matches (game, kind, team_a_id, team_b_id, status, result_status, scheduled_at)
  VALUES (_game, 'open_cup', v_team_a, v_team_b, 'pending', 'scheduled', now())
  RETURNING id INTO v_match_id;

  FOR i IN 1.._team_size LOOP
    INSERT INTO match_rosters (match_id, team_id, user_id) VALUES (v_match_id, v_team_a, v_picked[i]);
  END LOOP;
  FOR i IN _team_size+1..v_needed LOOP
    INSERT INTO match_rosters (match_id, team_id, user_id) VALUES (v_match_id, v_team_b, v_picked[i]);
  END LOOP;

  -- Notify all participants
  INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id, action_url)
  SELECT unnest(v_picked), 'Open Cup match found', 'Your Open Cup match is ready. Open it to ready up.', 'open_cup_match', 'match', v_match_id, '/matches/' || v_match_id;

  RETURN jsonb_build_object('status','matched','match_id', v_match_id);
END;
$$;

-- 5) Cancel queue
CREATE OR REPLACE FUNCTION public.cancel_open_cup_queue()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM open_cup_queue WHERE user_id = auth.uid();
$$;

-- 6) Submit Open Cup result (roster member)
CREATE OR REPLACE FUNCTION public.submit_open_cup_result(_match_id uuid, _score_a int, _score_b int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE m record; v_team uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;
  IF m.result_status NOT IN ('scheduled','live','awaiting_result') THEN RAISE EXCEPTION 'Match not in submittable state'; END IF;
  SELECT team_id INTO v_team FROM match_rosters WHERE match_id = _match_id AND user_id = auth.uid() LIMIT 1;
  IF v_team IS NULL THEN RAISE EXCEPTION 'Only participants can submit'; END IF;

  UPDATE matches SET
    score_a = _score_a, score_b = _score_b,
    result_status = 'pending_confirmation', submitted_by = auth.uid(), submitted_at = now()
  WHERE id = _match_id;
END;
$$;

-- 7) Confirm Open Cup result (opposing side)
CREATE OR REPLACE FUNCTION public.confirm_open_cup_result(_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE m record; v_team uuid; v_submitter_team uuid; v_winner uuid;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;
  IF m.result_status <> 'pending_confirmation' THEN RAISE EXCEPTION 'Nothing to confirm'; END IF;
  SELECT team_id INTO v_team FROM match_rosters WHERE match_id = _match_id AND user_id = auth.uid() LIMIT 1;
  IF v_team IS NULL THEN RAISE EXCEPTION 'Only participants can confirm'; END IF;
  SELECT team_id INTO v_submitter_team FROM match_rosters WHERE match_id = _match_id AND user_id = m.submitted_by LIMIT 1;
  IF v_team = v_submitter_team THEN RAISE EXCEPTION 'Opposing side must confirm'; END IF;

  v_winner := CASE WHEN m.score_a > m.score_b THEN m.team_a_id WHEN m.score_b > m.score_a THEN m.team_b_id ELSE NULL END;
  UPDATE matches SET
    result_status='confirmed', status='completed', winner_id=v_winner,
    confirmed_by=auth.uid(), confirmed_at=now(), played_at=COALESCE(played_at, now())
  WHERE id=_match_id;
END;
$$;

-- 8) Admin resolve open cup
CREATE OR REPLACE FUNCTION public.admin_resolve_open_cup_match(_match_id uuid, _score_a int, _score_b int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE m record; v_winner uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'Staff only'; END IF;
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL OR m.kind <> 'open_cup' THEN RAISE EXCEPTION 'Not an Open Cup match'; END IF;
  v_winner := CASE WHEN _score_a > _score_b THEN m.team_a_id WHEN _score_b > _score_a THEN m.team_b_id ELSE NULL END;
  UPDATE matches SET score_a=_score_a, score_b=_score_b, winner_id=v_winner,
    result_status='admin_resolved', status='completed', confirmed_by=auth.uid(), confirmed_at=now(),
    played_at=COALESCE(played_at, now())
  WHERE id=_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_open_cup_queue(text,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_open_cup_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_open_cup_result(uuid,int,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_open_cup_result(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_open_cup_match(uuid,int,int) TO authenticated;
