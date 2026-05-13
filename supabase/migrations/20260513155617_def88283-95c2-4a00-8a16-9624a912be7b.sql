
-- 1. Add ready / lock columns to existing signups
ALTER TABLE public.tournament_team_signups
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS roster_locked_at timestamptz;

-- 2. Roster members table
CREATE TABLE IF NOT EXISTS public.tournament_roster_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  signup_id uuid NOT NULL REFERENCES public.tournament_team_signups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('captain','player','substitute')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','accepted','declined','removed','locked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  UNIQUE (signup_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trm_signup ON public.tournament_roster_members(signup_id);
CREATE INDEX IF NOT EXISTS idx_trm_user ON public.tournament_roster_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trm_tournament ON public.tournament_roster_members(tournament_id);

ALTER TABLE public.tournament_roster_members ENABLE ROW LEVEL SECURITY;

-- Helper: is user the captain of this signup
CREATE OR REPLACE FUNCTION public.is_signup_captain(_user_id uuid, _signup_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_team_signups s
    WHERE s.id = _signup_id AND s.captain_user_id = _user_id
  );
$$;

-- RLS policies
DROP POLICY IF EXISTS "Roster public read" ON public.tournament_roster_members;
CREATE POLICY "Roster public read" ON public.tournament_roster_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage roster" ON public.tournament_roster_members;
CREATE POLICY "Staff manage roster" ON public.tournament_roster_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

-- All writes go through RPCs; we keep direct insert/update/delete restricted.

-- 3. Auto-attach captain when signup approved
CREATE OR REPLACE FUNCTION public._cup_attach_captain_on_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.captain_user_id IS NOT NULL THEN
    INSERT INTO public.tournament_roster_members
      (tournament_id, signup_id, user_id, invited_by, role, status, accepted_at)
    VALUES
      (NEW.tournament_id, NEW.id, NEW.captain_user_id, NEW.captain_user_id, 'captain', 'accepted', now())
    ON CONFLICT (signup_id, user_id) DO UPDATE
      SET role = 'captain', status = 'accepted', accepted_at = COALESCE(public.tournament_roster_members.accepted_at, now());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_cup_attach_captain ON public.tournament_team_signups;
CREATE TRIGGER trg_cup_attach_captain
AFTER UPDATE ON public.tournament_team_signups
FOR EACH ROW EXECUTE FUNCTION public._cup_attach_captain_on_approval();

-- 4. RPC: invite a player
CREATE OR REPLACE FUNCTION public.cup_invite_player(_signup_id uuid, _user_id uuid, _role text DEFAULT 'player')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_signup public.tournament_team_signups%ROWTYPE;
  v_count int;
  v_member_id uuid;
  v_team_name text;
  v_t_name text;
BEGIN
  SELECT * INTO v_signup FROM public.tournament_team_signups WHERE id = _signup_id;
  IF v_signup.id IS NULL THEN RAISE EXCEPTION 'Signup not found'; END IF;
  IF v_signup.captain_user_id <> auth.uid() AND NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Only the captain can invite players';
  END IF;
  IF v_signup.status NOT IN ('approved','checked_in') THEN
    RAISE EXCEPTION 'Team must be approved before inviting players';
  END IF;
  IF v_signup.roster_locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Roster is locked';
  END IF;
  IF _role NOT IN ('player','substitute') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF _user_id = v_signup.captain_user_id THEN
    RAISE EXCEPTION 'Captain is already on the roster';
  END IF;

  SELECT count(*) INTO v_count FROM public.tournament_roster_members
   WHERE signup_id = _signup_id AND status IN ('invited','accepted');
  IF v_count >= 7 THEN RAISE EXCEPTION 'Roster full (max 7)'; END IF;

  INSERT INTO public.tournament_roster_members
    (tournament_id, signup_id, user_id, invited_by, role, status)
  VALUES
    (v_signup.tournament_id, _signup_id, _user_id, auth.uid(), _role, 'invited')
  ON CONFLICT (signup_id, user_id) DO UPDATE
    SET status = 'invited', role = EXCLUDED.role, invited_by = EXCLUDED.invited_by,
        accepted_at = NULL, declined_at = NULL
  RETURNING id INTO v_member_id;

  v_team_name := v_signup.team_name;
  SELECT name INTO v_t_name FROM public.tournaments WHERE id = v_signup.tournament_id;

  INSERT INTO public.notifications (user_id, type, title, message, action_url, entity_type, entity_id, meta)
  VALUES (
    _user_id, 'cup_roster_invite',
    'Community Cup roster invite',
    'You have been invited to join ' || v_team_name || ' for ' || COALESCE(v_t_name,'Community Cup') || '.',
    '/tournaments/community-cup-1',
    'tournament_roster_member', v_member_id,
    jsonb_build_object('signup_id', _signup_id, 'tournament_id', v_signup.tournament_id, 'team_name', v_team_name)
  );

  RETURN v_member_id;
END $$;

-- 5. RPC: cancel invite (captain)
CREATE OR REPLACE FUNCTION public.cup_cancel_invite(_member_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_m public.tournament_roster_members%ROWTYPE; v_signup public.tournament_team_signups%ROWTYPE;
BEGIN
  SELECT * INTO v_m FROM public.tournament_roster_members WHERE id = _member_id;
  IF v_m.id IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  SELECT * INTO v_signup FROM public.tournament_team_signups WHERE id = v_m.signup_id;
  IF v_signup.captain_user_id <> auth.uid() AND NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Only the captain can cancel invites';
  END IF;
  IF v_signup.roster_locked_at IS NOT NULL THEN RAISE EXCEPTION 'Roster locked'; END IF;
  IF v_m.status <> 'invited' THEN RAISE EXCEPTION 'Only pending invites can be cancelled'; END IF;
  DELETE FROM public.tournament_roster_members WHERE id = _member_id;
END $$;

-- 6. RPC: respond to invite
CREATE OR REPLACE FUNCTION public.cup_respond_invite(_member_id uuid, _accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_m public.tournament_roster_members%ROWTYPE;
  v_signup public.tournament_team_signups%ROWTYPE;
  v_uname text;
BEGIN
  SELECT * INTO v_m FROM public.tournament_roster_members WHERE id = _member_id;
  IF v_m.id IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF v_m.user_id <> auth.uid() THEN RAISE EXCEPTION 'Not your invite'; END IF;
  IF v_m.status <> 'invited' THEN RAISE EXCEPTION 'Invite already handled'; END IF;
  SELECT * INTO v_signup FROM public.tournament_team_signups WHERE id = v_m.signup_id;
  IF v_signup.roster_locked_at IS NOT NULL THEN RAISE EXCEPTION 'Roster locked'; END IF;

  UPDATE public.tournament_roster_members
     SET status = CASE WHEN _accept THEN 'accepted' ELSE 'declined' END,
         accepted_at = CASE WHEN _accept THEN now() ELSE NULL END,
         declined_at = CASE WHEN _accept THEN NULL ELSE now() END
   WHERE id = _member_id;

  SELECT COALESCE(display_name, username, 'A player') INTO v_uname FROM public.profiles WHERE id = auth.uid();

  IF v_signup.captain_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url, entity_type, entity_id, meta)
    VALUES (
      v_signup.captain_user_id,
      CASE WHEN _accept THEN 'cup_roster_accepted' ELSE 'cup_roster_declined' END,
      CASE WHEN _accept THEN 'Roster invite accepted' ELSE 'Roster invite declined' END,
      v_uname || (CASE WHEN _accept THEN ' joined ' ELSE ' declined to join ' END) || v_signup.team_name || '.',
      '/tournaments/community-cup-1',
      'tournament_roster_member', _member_id,
      jsonb_build_object('signup_id', v_signup.id, 'tournament_id', v_signup.tournament_id)
    );
  END IF;
END $$;

-- 7. RPC: remove member (captain before lock, or admin anytime)
CREATE OR REPLACE FUNCTION public.cup_remove_member(_member_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_m public.tournament_roster_members%ROWTYPE; v_s public.tournament_team_signups%ROWTYPE;
BEGIN
  SELECT * INTO v_m FROM public.tournament_roster_members WHERE id = _member_id;
  IF v_m.id IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
  SELECT * INTO v_s FROM public.tournament_team_signups WHERE id = v_m.signup_id;
  IF v_m.role = 'captain' THEN RAISE EXCEPTION 'Cannot remove captain'; END IF;
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    IF v_s.captain_user_id <> auth.uid() THEN RAISE EXCEPTION 'Only captain or admin can remove'; END IF;
    IF v_s.roster_locked_at IS NOT NULL THEN RAISE EXCEPTION 'Roster locked'; END IF;
  END IF;
  DELETE FROM public.tournament_roster_members WHERE id = _member_id;
END $$;

-- 8. RPC: mark team ready
CREATE OR REPLACE FUNCTION public.cup_mark_team_ready(_signup_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_s public.tournament_team_signups%ROWTYPE; v_accepted int; v_pending int; v_admin uuid;
BEGIN
  SELECT * INTO v_s FROM public.tournament_team_signups WHERE id = _signup_id;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'Signup not found'; END IF;
  IF v_s.captain_user_id <> auth.uid() AND NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Only the captain can mark ready';
  END IF;
  IF v_s.status NOT IN ('approved','checked_in') THEN RAISE EXCEPTION 'Team is not approved'; END IF;
  IF v_s.roster_locked_at IS NOT NULL THEN RAISE EXCEPTION 'Roster locked'; END IF;

  SELECT count(*) INTO v_accepted FROM public.tournament_roster_members
   WHERE signup_id = _signup_id AND status = 'accepted' AND role IN ('captain','player');
  SELECT count(*) INTO v_pending FROM public.tournament_roster_members
   WHERE signup_id = _signup_id AND status = 'invited' AND role IN ('captain','player');

  IF v_accepted < 5 THEN
    RAISE EXCEPTION 'Need 5 accepted players (captain + 4). Currently % accepted, % pending', v_accepted, v_pending;
  END IF;

  UPDATE public.tournament_team_signups SET ready_at = now() WHERE id = _signup_id;

  -- Notify admins
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role IN ('admin','moderator') LOOP
    INSERT INTO public.notifications (user_id, type, title, message, action_url, entity_type, entity_id, meta)
    VALUES (
      v_admin, 'cup_team_ready', 'Team ready',
      v_s.team_name || ' is ready for Community Cup.',
      '/admin/community-cup',
      'tournament_team_signup', v_s.id,
      jsonb_build_object('tournament_id', v_s.tournament_id)
    );
  END LOOP;
END $$;

-- 9. Admin lock / unlock
CREATE OR REPLACE FUNCTION public.cup_admin_lock_roster(_signup_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.tournament_team_signups SET roster_locked_at = now() WHERE id = _signup_id;
  UPDATE public.tournament_roster_members SET status = 'locked' WHERE signup_id = _signup_id AND status = 'accepted';
END $$;

CREATE OR REPLACE FUNCTION public.cup_admin_unlock_roster(_signup_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.tournament_team_signups SET roster_locked_at = NULL WHERE id = _signup_id;
  UPDATE public.tournament_roster_members SET status = 'accepted' WHERE signup_id = _signup_id AND status = 'locked';
END $$;

-- 10. Update bracket generator to require ready teams (back-compat: also accepts checked_in)
CREATE OR REPLACE FUNCTION public.generate_community_cup_bracket(_tournament_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  v_signup_ids uuid[];
  n int; size int; rounds int; i int; r int;
  v_match_id uuid;
  v_prev_ids uuid[];
  v_curr_ids uuid[];
  v_game text;
  v_default_bo text;
  v_final_bo text;
  v_map_mode text;
  v_created int := 0;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT game, COALESCE(match_format_default,'BO1'), COALESCE(match_format_final,'BO3'), COALESCE(map_selection_mode,'admin_manual')
  INTO v_game, v_default_bo, v_final_bo, v_map_mode
  FROM public.tournaments WHERE id = _tournament_id;

  SELECT array_agg(id ORDER BY random())
  INTO v_signup_ids
  FROM public.tournament_team_signups
  WHERE tournament_id = _tournament_id
    AND status IN ('approved','checked_in')
    AND (ready_at IS NOT NULL OR checked_in_at IS NOT NULL);

  IF v_signup_ids IS NULL OR array_length(v_signup_ids,1) < 2 THEN
    RAISE EXCEPTION 'Need at least 2 ready teams';
  END IF;

  -- Auto-lock rosters of participating teams
  UPDATE public.tournament_team_signups
     SET roster_locked_at = COALESCE(roster_locked_at, now())
   WHERE id = ANY(v_signup_ids);

  DELETE FROM public.matches
   WHERE tournament_id = _tournament_id
     AND status IN ('pending','scheduled')
     AND winner_id IS NULL;

  n := array_length(v_signup_ids,1);
  size := 1; WHILE size < n LOOP size := size * 2; END LOOP;
  rounds := (ln(size)/ln(2))::int;

  v_curr_ids := ARRAY[]::uuid[];
  FOR r IN REVERSE rounds..1 LOOP
    v_prev_ids := v_curr_ids;
    v_curr_ids := ARRAY[]::uuid[];
    FOR i IN 1..(size / (2 ^ (rounds - r + 1))::int) LOOP
      INSERT INTO public.matches (
        tournament_id, game, status, result_status, kind,
        round, bracket_position,
        next_match_id, next_match_slot,
        bo_format, map_selection_mode, veto_status
      ) VALUES (
        _tournament_id, v_game, 'pending', 'scheduled', 'tournament',
        r, i,
        CASE WHEN r < rounds THEN v_prev_ids[((i-1)/2)+1] ELSE NULL END,
        CASE WHEN r < rounds THEN (CASE WHEN i % 2 = 1 THEN 'a' ELSE 'b' END) ELSE NULL END,
        CASE WHEN r = rounds THEN v_final_bo ELSE v_default_bo END,
        v_map_mode, 'not_started'
      ) RETURNING id INTO v_match_id;
      v_curr_ids := array_append(v_curr_ids, v_match_id);
      v_created := v_created + 1;
    END LOOP;
  END LOOP;

  FOR i IN 1..(size/2) LOOP
    UPDATE public.matches
       SET signup_a_id = v_signup_ids[(i-1)*2 + 1],
           signup_b_id = CASE WHEN (i-1)*2 + 2 <= n THEN v_signup_ids[(i-1)*2 + 2] ELSE NULL END
     WHERE tournament_id = _tournament_id AND round = 1 AND bracket_position = i;
  END LOOP;

  RETURN v_created;
END $function$;
