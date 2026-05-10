
-- 1) Block duplicate team membership for same game
CREATE OR REPLACE FUNCTION public.enforce_one_team_per_game()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game text;
  v_is_demo boolean;
  v_exists boolean;
BEGIN
  SELECT game, is_demo INTO v_game, v_is_demo FROM public.teams WHERE id = NEW.team_id;
  IF v_game IS NULL OR v_is_demo IS TRUE THEN
    RETURN NEW;
  END IF;
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    WHERE tm.user_id = NEW.user_id
      AND t.game = v_game
      AND t.is_demo = false
      AND tm.team_id <> NEW.team_id
  ) INTO v_exists;
  IF v_exists THEN
    RAISE EXCEPTION 'You are already in a % team. Leave your current team before joining another.', v_game
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_one_team_per_game ON public.team_members;
CREATE TRIGGER trg_one_team_per_game
BEFORE INSERT ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_one_team_per_game();

-- 2) Block creating multiple owned teams per game
CREATE OR REPLACE FUNCTION public.enforce_one_owned_team_per_game()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_exists boolean;
BEGIN
  IF NEW.is_demo THEN RETURN NEW; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE owner_id = NEW.owner_id
      AND game = NEW.game
      AND is_demo = false
      AND id <> NEW.id
  ) INTO v_exists;
  IF v_exists THEN
    RAISE EXCEPTION 'You already own a % team.', NEW.game
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_one_owned_team_per_game ON public.teams;
CREATE TRIGGER trg_one_owned_team_per_game
BEFORE INSERT OR UPDATE OF owner_id, game ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.enforce_one_owned_team_per_game();

-- 3) Auto-resolve related notifications when team_join_request is accepted/rejected
CREATE OR REPLACE FUNCTION public.resolve_join_request_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('accepted','rejected') AND NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.notifications
       SET status = 'resolved', is_read = true
     WHERE entity_type = 'team_join_request'
       AND entity_id = NEW.id
       AND status <> 'resolved';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_resolve_join_request_notifications ON public.team_join_requests;
CREATE TRIGGER trg_resolve_join_request_notifications
AFTER UPDATE ON public.team_join_requests
FOR EACH ROW EXECUTE FUNCTION public.resolve_join_request_notifications();

-- 4) Accept scrim request -> create real scrim match (idempotent)
ALTER TABLE public.scrim_requests
  ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by uuid;

CREATE OR REPLACE FUNCTION public.accept_scrim_request(_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_match_id uuid;
  v_owner_a uuid;
  v_owner_b uuid;
BEGIN
  SELECT * INTO r FROM public.scrim_requests WHERE id = _request_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Scrim request not found'; END IF;
  IF r.status = 'accepted' AND r.match_id IS NOT NULL THEN
    RETURN r.match_id; -- idempotent
  END IF;
  IF r.status NOT IN ('open','pending') THEN
    RAISE EXCEPTION 'Scrim request is not open';
  END IF;
  IF r.target_team_id IS NULL THEN
    RAISE EXCEPTION 'Open scrims must be claimed via a different flow';
  END IF;
  IF NOT public.is_team_captain(auth.uid(), r.target_team_id) THEN
    RAISE EXCEPTION 'Only the target team captain can accept this scrim';
  END IF;

  INSERT INTO public.matches (game, team_a_id, team_b_id, scheduled_at, status, result_status, kind)
  VALUES (r.game, r.challenger_team_id, r.target_team_id, r.scheduled_date, 'pending', 'scheduled', 'scrim')
  RETURNING id INTO v_match_id;

  UPDATE public.scrim_requests
     SET status = 'accepted', match_id = v_match_id, accepted_at = now(), accepted_by = auth.uid()
   WHERE id = _request_id;

  -- Resolve any pending invite notifications
  UPDATE public.notifications
     SET status = 'resolved', is_read = true
   WHERE entity_type = 'scrim_request' AND entity_id = _request_id;

  -- Notify both team owners
  SELECT owner_id INTO v_owner_a FROM public.teams WHERE id = r.challenger_team_id;
  SELECT owner_id INTO v_owner_b FROM public.teams WHERE id = r.target_team_id;
  IF v_owner_a IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url)
    VALUES (v_owner_a, 'Scrim accepted', 'Your scrim invite was accepted. Match scheduled.',
            'scrim_accepted', 'match', v_match_id, '/matches/' || v_match_id);
  END IF;
  IF v_owner_b IS NOT NULL AND v_owner_b <> v_owner_a THEN
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url)
    VALUES (v_owner_b, 'Scrim scheduled', 'Your scrim match is scheduled.',
            'scrim_accepted', 'match', v_match_id, '/matches/' || v_match_id);
  END IF;
  RETURN v_match_id;
END $$;

CREATE OR REPLACE FUNCTION public.decline_scrim_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record; v_owner uuid;
BEGIN
  SELECT * INTO r FROM public.scrim_requests WHERE id = _request_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Scrim request not found'; END IF;
  IF r.target_team_id IS NULL OR NOT public.is_team_captain(auth.uid(), r.target_team_id) THEN
    RAISE EXCEPTION 'Only the target team captain can decline';
  END IF;
  UPDATE public.scrim_requests SET status = 'declined' WHERE id = _request_id;
  UPDATE public.notifications SET status = 'resolved', is_read = true
   WHERE entity_type = 'scrim_request' AND entity_id = _request_id;
  SELECT owner_id INTO v_owner FROM public.teams WHERE id = r.challenger_team_id;
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url)
    VALUES (v_owner, 'Scrim declined', 'Your scrim invite was declined.',
            'scrim_declined', 'scrim_request', _request_id, '/scrims');
  END IF;
END $$;
