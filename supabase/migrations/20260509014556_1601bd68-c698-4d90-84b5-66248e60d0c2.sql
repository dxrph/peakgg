-- 1. Schema additions
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'generic',
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'unread',
  ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_user_status
  ON public.notifications(user_id, status, created_at DESC);

-- 2. Helper RPC: mark resolved (only owner)
CREATE OR REPLACE FUNCTION public.resolve_notification(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
     SET status = 'resolved', is_read = true
   WHERE id = _id AND user_id = auth.uid();
END;
$$;

-- 3. Update notify_team_join_request to add type + entity + action_url + meta
CREATE OR REPLACE FUNCTION public.notify_team_join_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_team_name text;
  v_username text;
BEGIN
  SELECT owner_id, name INTO v_owner, v_team_name FROM public.teams WHERE id = NEW.team_id;
  SELECT COALESCE(display_name, username) INTO v_username FROM public.profiles WHERE id = NEW.user_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url, meta)
    VALUES (
      v_owner,
      'New team application',
      COALESCE(v_username,'A player') || ' applied to join ' || COALESCE(v_team_name,'your team'),
      'team_application',
      'team_join_request',
      NEW.id,
      '/teams/' || NEW.team_id || '/manage',
      jsonb_build_object(
        'team_id', NEW.team_id,
        'team_name', v_team_name,
        'applicant_id', NEW.user_id,
        'applicant_name', v_username,
        'request_id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Update handle_team_join_request_status to add type + action_url
CREATE OR REPLACE FUNCTION public.handle_team_join_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_name text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT name INTO v_team_name FROM public.teams WHERE id = NEW.team_id;

  IF NEW.status = 'accepted' THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (NEW.team_id, NEW.user_id, COALESCE(NEW.role, 'Member'))
    ON CONFLICT DO NOTHING;
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url, meta)
    VALUES (
      NEW.user_id,
      'Application accepted',
      'You joined ' || COALESCE(v_team_name,'the team'),
      'team_application_accepted',
      'team',
      NEW.team_id,
      '/teams/' || NEW.team_id,
      jsonb_build_object('team_id', NEW.team_id, 'team_name', v_team_name)
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url, meta)
    VALUES (
      NEW.user_id,
      'Application rejected',
      'Your application to ' || COALESCE(v_team_name,'the team') || ' was not accepted',
      'team_application_rejected',
      'team',
      NEW.team_id,
      '/teams/' || NEW.team_id,
      jsonb_build_object('team_id', NEW.team_id, 'team_name', v_team_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 5. New trigger: notify on result submission (pending confirmation)
CREATE OR REPLACE FUNCTION public.notify_match_result_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_a_name text;
  v_team_b_name text;
  v_other_team uuid;
  v_other_owner uuid;
  v_score text;
BEGIN
  IF NEW.result_status = 'pending_confirmation'
     AND (OLD.result_status IS DISTINCT FROM 'pending_confirmation') THEN
    SELECT name INTO v_team_a_name FROM public.teams WHERE id = NEW.team_a_id;
    SELECT name INTO v_team_b_name FROM public.teams WHERE id = NEW.team_b_id;
    v_score := COALESCE(NEW.score_a::text,'0') || '-' || COALESCE(NEW.score_b::text,'0');

    -- Determine opposing team based on submitter
    IF NEW.submitted_by IS NOT NULL AND public.is_team_captain(NEW.submitted_by, NEW.team_a_id) THEN
      v_other_team := NEW.team_b_id;
    ELSE
      v_other_team := NEW.team_a_id;
    END IF;

    SELECT owner_id INTO v_other_owner FROM public.teams WHERE id = v_other_team;
    IF v_other_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url, meta)
      VALUES (
        v_other_owner,
        'Result pending confirmation',
        COALESCE(v_team_a_name,'Team A') || ' vs ' || COALESCE(v_team_b_name,'Team B') || ' — submitted ' || v_score,
        'match_result_pending',
        'match',
        NEW.id,
        '/matches/' || NEW.id,
        jsonb_build_object(
          'match_id', NEW.id,
          'team_a_name', v_team_a_name,
          'team_b_name', v_team_b_name,
          'score_a', NEW.score_a,
          'score_b', NEW.score_b
        )
      );
    END IF;
  END IF;

  -- Dispute notification for opposing captain
  IF NEW.result_status = 'disputed' AND OLD.result_status IS DISTINCT FROM 'disputed' THEN
    SELECT name INTO v_team_a_name FROM public.teams WHERE id = NEW.team_a_id;
    SELECT name INTO v_team_b_name FROM public.teams WHERE id = NEW.team_b_id;
    -- notify both team owners
    FOR v_other_owner IN
      SELECT owner_id FROM public.teams WHERE id IN (NEW.team_a_id, NEW.team_b_id) AND owner_id IS NOT NULL
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url, meta)
      VALUES (
        v_other_owner,
        'Match result disputed',
        COALESCE(v_team_a_name,'Team A') || ' vs ' || COALESCE(v_team_b_name,'Team B'),
        'match_disputed',
        'match',
        NEW.id,
        '/matches/' || NEW.id,
        jsonb_build_object('match_id', NEW.id)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_match_result_submitted ON public.matches;
CREATE TRIGGER trg_notify_match_result_submitted
AFTER UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.notify_match_result_submitted();

-- 6. League registration approval notification
CREATE OR REPLACE FUNCTION public.notify_league_registration_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_team_name text;
  v_league_id uuid;
  v_league_name text;
  v_league_slug text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT owner_id, name INTO v_owner, v_team_name FROM public.teams WHERE id = NEW.team_id;
  SELECT l.id, l.name, l.slug INTO v_league_id, v_league_name, v_league_slug
    FROM public.league_seasons s JOIN public.leagues l ON l.id = s.league_id
    WHERE s.id = NEW.season_id;

  IF NEW.status = 'approved' AND v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url, meta)
    VALUES (
      v_owner,
      'Team registration approved',
      COALESCE(v_team_name,'Your team') || ' was approved for ' || COALESCE(v_league_name,'the league'),
      'league_registration_approved',
      'league',
      v_league_id,
      '/leagues/' || COALESCE(v_league_slug, v_league_id::text),
      jsonb_build_object(
        'team_id', NEW.team_id,
        'team_name', v_team_name,
        'league_id', v_league_id,
        'league_name', v_league_name,
        'league_slug', v_league_slug,
        'season_id', NEW.season_id
      )
    );
  ELSIF NEW.status = 'rejected' AND v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id, action_url, meta)
    VALUES (
      v_owner,
      'Team registration rejected',
      'Your registration for ' || COALESCE(v_league_name,'the league') || ' was not accepted',
      'league_registration_rejected',
      'league',
      v_league_id,
      '/leagues/' || COALESCE(v_league_slug, v_league_id::text),
      jsonb_build_object('team_id', NEW.team_id, 'league_name', v_league_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_league_registration_status ON public.league_registrations;
CREATE TRIGGER trg_notify_league_registration_status
AFTER UPDATE ON public.league_registrations
FOR EACH ROW EXECUTE FUNCTION public.notify_league_registration_status();