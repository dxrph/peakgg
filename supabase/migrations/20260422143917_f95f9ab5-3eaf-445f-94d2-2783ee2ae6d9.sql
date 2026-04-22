
-- Allow trigger functions (SECURITY DEFINER) to insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ Trigger: added to team ============
CREATE OR REPLACE FUNCTION public.notify_team_member_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_name text;
  v_owner_id uuid;
BEGIN
  SELECT name, owner_id INTO v_team_name, v_owner_id FROM public.teams WHERE id = NEW.team_id;
  -- Notify the new member only if they didn't add themselves (i.e. owner added them)
  IF NEW.user_id <> COALESCE(v_owner_id, NEW.user_id) THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.user_id, 'Sei stato aggiunto a un team', 'Ora fai parte del team ' || COALESCE(v_team_name, ''));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_team_member_added ON public.team_members;
CREATE TRIGGER trg_notify_team_member_added
AFTER INSERT ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.notify_team_member_added();

-- ============ Trigger: tournament registration confirmed ============
CREATE OR REPLACE FUNCTION public.notify_tournament_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_name text;
  v_team_name text;
BEGIN
  SELECT name INTO v_tournament_name FROM public.tournaments WHERE id = NEW.tournament_id;
  SELECT name INTO v_team_name FROM public.teams WHERE id = NEW.team_id;

  -- Notify all members of the team
  INSERT INTO public.notifications (user_id, title, message)
  SELECT tm.user_id,
         'Iscrizione confermata',
         'Il team ' || COALESCE(v_team_name, '') || ' è iscritto a ' || COALESCE(v_tournament_name, '')
  FROM public.team_members tm
  WHERE tm.team_id = NEW.team_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_tournament_registration ON public.tournament_registrations;
CREATE TRIGGER trg_notify_tournament_registration
AFTER INSERT ON public.tournament_registrations
FOR EACH ROW EXECUTE FUNCTION public.notify_tournament_registration();

-- ============ Trigger: match result updated ============
CREATE OR REPLACE FUNCTION public.notify_match_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed' OR OLD.winner_id IS DISTINCT FROM NEW.winner_id) THEN
    v_msg := 'Risultato finale: ' || COALESCE(NEW.score_a::text, '0') || ' - ' || COALESCE(NEW.score_b::text, '0');

    -- Notify individual players if present
    IF NEW.player_a_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.player_a_id, 'Match completato', v_msg);
    END IF;
    IF NEW.player_b_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.player_b_id, 'Match completato', v_msg);
    END IF;

    -- Notify team members
    IF NEW.team_a_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message)
      SELECT tm.user_id, 'Match del team completato', v_msg
      FROM public.team_members tm WHERE tm.team_id = NEW.team_a_id;
    END IF;
    IF NEW.team_b_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message)
      SELECT tm.user_id, 'Match del team completato', v_msg
      FROM public.team_members tm WHERE tm.team_id = NEW.team_b_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_match_result ON public.matches;
CREATE TRIGGER trg_notify_match_result
AFTER UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.notify_match_result();

-- ============ Index for unread notifications ============
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON public.notifications (user_id, is_read, created_at DESC);
