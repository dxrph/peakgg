
-- 1) Backfill: ensure every team owner is in team_members as Captain
INSERT INTO public.team_members (team_id, user_id, role)
SELECT t.id, t.owner_id, 'Captain'
FROM public.teams t
WHERE t.owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = t.id AND tm.user_id = t.owner_id
  );

-- 2) Notify owner when a join request is created
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
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      v_owner,
      'New team application',
      COALESCE(v_username,'A player') || ' wants to join ' || COALESCE(v_team_name,'your team')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_team_join_request ON public.team_join_requests;
CREATE TRIGGER trg_notify_team_join_request
AFTER INSERT ON public.team_join_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_team_join_request();

-- 3) On accept/reject: notify applicant + auto-add to team_members on accept
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
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.user_id, 'Application accepted', 'You joined ' || COALESCE(v_team_name,'the team'));
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.user_id, 'Application rejected', 'Your application to ' || COALESCE(v_team_name,'the team') || ' was rejected');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_team_join_request_status ON public.team_join_requests;
CREATE TRIGGER trg_handle_team_join_request_status
AFTER UPDATE ON public.team_join_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_team_join_request_status();
