-- Platform settings (key/value flags) — admin-managed
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings readable by all authenticated" ON public.platform_settings;
CREATE POLICY "platform_settings readable by all authenticated"
ON public.platform_settings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "platform_settings admin write" ON public.platform_settings;
CREATE POLICY "platform_settings admin write"
ON public.platform_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.platform_settings (key, value)
VALUES ('open_cup_public_queue_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Patch join_open_cup_queue with an authorization gate
CREATE OR REPLACE FUNCTION public.join_open_cup_queue(_game text, _team_size integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_active uuid;
  v_needed int;
  v_count int;
  v_picked uuid[];
  v_team_a uuid := gen_random_uuid();
  v_team_b uuid := gen_random_uuid();
  v_match_id uuid;
  v_public_enabled boolean;
  i int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  -- Public-queue feature flag enforced server-side. Admins bypass for QA.
  SELECT COALESCE((value)::boolean, false) INTO v_public_enabled
  FROM platform_settings WHERE key = 'open_cup_public_queue_enabled';
  IF NOT COALESCE(v_public_enabled, false) AND NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'Open Cup is in closed beta. Join via Discord.' USING ERRCODE = '42501';
  END IF;

  IF _game NOT IN ('valorant','cs2','r6s') THEN RAISE EXCEPTION 'Invalid game'; END IF;
  IF _team_size NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Invalid team size'; END IF;

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
  FOR i IN (_team_size+1)..v_needed LOOP
    INSERT INTO match_rosters (match_id, team_id, user_id) VALUES (v_match_id, v_team_b, v_picked[i]);
  END LOOP;

  RETURN jsonb_build_object('status','matched','match_id', v_match_id);
END;
$function$;