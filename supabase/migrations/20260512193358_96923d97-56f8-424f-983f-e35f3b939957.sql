
-- ============================================================
-- PHASE 2: COMMUNITY CUP MATCH-DAY
-- ============================================================

-- 1. matches additions
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS selected_map text,
  ADD COLUMN IF NOT EXISTS veto_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS result_screenshot_url text,
  ADD COLUMN IF NOT EXISTS result_notes text,
  ADD COLUMN IF NOT EXISTS reported_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS chat_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS bo_format text,
  ADD COLUMN IF NOT EXISTS signup_a_id uuid REFERENCES public.tournament_team_signups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signup_b_id uuid REFERENCES public.tournament_team_signups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dispute_status text,
  ADD COLUMN IF NOT EXISTS dispute_reason text;

CREATE INDEX IF NOT EXISTS idx_matches_signup_a ON public.matches(signup_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_signup_b ON public.matches(signup_b_id);

-- 2. veto current turn pointer (signup-based for cup)
ALTER TABLE public.match_map_veto
  ADD COLUMN IF NOT EXISTS current_turn_signup_id uuid REFERENCES public.tournament_team_signups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pick_count integer NOT NULL DEFAULT 0;

-- 3. match_chat_messages additions
ALTER TABLE public.match_chat_messages
  ADD COLUMN IF NOT EXISTS is_system_message boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sender_role text;

-- 4. helper: is_cup_match_captain
CREATE OR REPLACE FUNCTION public.is_cup_match_captain(_user_id uuid, _match_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN sa.captain_user_id = _user_id THEN 'A'
    WHEN sb.captain_user_id = _user_id THEN 'B'
    ELSE NULL
  END
  FROM public.matches m
  LEFT JOIN public.tournament_team_signups sa ON sa.id = m.signup_a_id
  LEFT JOIN public.tournament_team_signups sb ON sb.id = m.signup_b_id
  WHERE m.id = _match_id
$$;

-- 5. update can_access_match_chat to include cup captains + system messages
CREATE OR REPLACE FUNCTION public.can_access_match_chat(_user_id uuid, _match_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM matches m
    WHERE m.id = _match_id
      AND (
        is_team_member(_user_id, m.team_a_id)
        OR is_team_member(_user_id, m.team_b_id)
        OR EXISTS (SELECT 1 FROM match_rosters r WHERE r.match_id = _match_id AND r.user_id = _user_id)
        OR public.is_cup_match_captain(_user_id, _match_id) IS NOT NULL
      )
  ) OR has_role(_user_id, 'admin') OR has_role(_user_id, 'moderator');
$$;

-- 6. match_chat_messages RLS — ensure policies cover cup
ALTER TABLE public.match_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Match chat read" ON public.match_chat_messages;
CREATE POLICY "Match chat read"
  ON public.match_chat_messages FOR SELECT
  USING (public.can_access_match_chat(auth.uid(), match_id));

DROP POLICY IF EXISTS "Match chat insert" ON public.match_chat_messages;
CREATE POLICY "Match chat insert"
  ON public.match_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_system_message = false
    AND public.can_access_match_chat(auth.uid(), match_id)
    AND NOT EXISTS (SELECT 1 FROM public.matches mm WHERE mm.id = match_id AND mm.chat_locked = true AND NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')))
  );

DROP POLICY IF EXISTS "Match chat admin manage" ON public.match_chat_messages;
CREATE POLICY "Match chat admin manage"
  ON public.match_chat_messages FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

-- 7. matches RLS — keep public-readable for tournament matches (already in place generally).
-- We don't change existing match policies; admins still full control.

-- 8. internal: post system message
CREATE OR REPLACE FUNCTION public._post_match_system_message(_match_id uuid, _msg text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.match_chat_messages (match_id, user_id, content, is_system_message, sender_role)
  VALUES (_match_id, '00000000-0000-0000-0000-000000000000'::uuid, _msg, true, 'system');
$$;
-- relax FK if user_id has FK to auth.users — match_chat_messages.user_id is plain uuid (no FK), so OK

-- 9. generate_community_cup_bracket
CREATE OR REPLACE FUNCTION public.generate_community_cup_bracket(_tournament_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
    AND status IN ('approved','checked_in');

  IF v_signup_ids IS NULL OR array_length(v_signup_ids,1) < 2 THEN
    RAISE EXCEPTION 'Need at least 2 approved/checked-in teams';
  END IF;

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

  -- fill round 1 with signup ids
  FOR i IN 1..(size/2) LOOP
    UPDATE public.matches
       SET signup_a_id = v_signup_ids[(i-1)*2 + 1],
           signup_b_id = CASE WHEN (i-1)*2 + 2 <= n THEN v_signup_ids[(i-1)*2 + 2] ELSE NULL END
     WHERE tournament_id = _tournament_id AND round = 1 AND bracket_position = i;
  END LOOP;

  RETURN v_created;
END $$;

-- 10. start_match_veto
CREATE OR REPLACE FUNCTION public.start_match_veto(_match_id uuid, _mode text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  m record; v_first_signup uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT * INTO m FROM public.matches WHERE id = _match_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;

  IF _mode IN ('captain_veto','bo1_veto','bo3_veto') THEN
    v_first_signup := m.signup_a_id;
    IF v_first_signup IS NULL THEN RAISE EXCEPTION 'Match needs both teams assigned'; END IF;
  END IF;

  INSERT INTO public.match_map_veto (match_id, tournament_id, mode, status, current_turn_signup_id, banned_maps, picked_maps, veto_log, started_at)
  VALUES (_match_id, m.tournament_id, _mode, 'in_progress', v_first_signup, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, now())
  ON CONFLICT (match_id) DO UPDATE
    SET mode = EXCLUDED.mode,
        status = 'in_progress',
        current_turn_signup_id = EXCLUDED.current_turn_signup_id,
        banned_maps = '[]'::jsonb,
        picked_maps = '[]'::jsonb,
        veto_log = '[]'::jsonb,
        selected_map = NULL,
        started_at = now(),
        completed_at = NULL,
        pick_count = 0;

  UPDATE public.matches
     SET veto_status = 'veto_pending',
         map_selection_mode = _mode,
         selected_map = NULL
   WHERE id = _match_id;

  PERFORM public._post_match_system_message(_match_id, 'Map veto started — mode: ' || _mode);

  -- Random mode: auto-pick now
  IF _mode = 'random' THEN
    PERFORM public._cup_random_pick_map(_match_id);
  END IF;
END $$;

-- 11. random pick helper
CREATE OR REPLACE FUNCTION public._cup_random_pick_map(_match_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_map text; v_tid uuid;
BEGIN
  SELECT tournament_id INTO v_tid FROM public.matches WHERE id = _match_id;
  SELECT map_name INTO v_map
  FROM public.tournament_map_pool
  WHERE tournament_id = v_tid AND is_active = true
  ORDER BY random() LIMIT 1;
  IF v_map IS NULL THEN RAISE EXCEPTION 'No active maps in pool'; END IF;

  UPDATE public.match_map_veto
     SET selected_map = v_map, status = 'completed', completed_at = now(),
         picked_maps = picked_maps || jsonb_build_array(jsonb_build_object('map', v_map, 'by','system')),
         veto_log = veto_log || jsonb_build_array(jsonb_build_object('action','random_pick','map', v_map, 'at', now()))
   WHERE match_id = _match_id;
  UPDATE public.matches SET selected_map = v_map, map = v_map, veto_status = 'map_selected' WHERE id = _match_id;
  PERFORM public._post_match_system_message(_match_id, 'Random map selected: ' || v_map);
END $$;

-- 12. captain_ban_map
CREATE OR REPLACE FUNCTION public.captain_ban_map(_match_id uuid, _map text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v record; v_side text; v_tid uuid; v_active_count int; v_remaining int;
  v_other_signup uuid; v_signup uuid;
BEGIN
  v_side := public.is_cup_match_captain(auth.uid(), _match_id);
  IF v_side IS NULL AND NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'You can only act on matches involving your team';
  END IF;
  SELECT v.*, m.signup_a_id, m.signup_b_id, m.tournament_id
    INTO v
    FROM public.match_map_veto v
    JOIN public.matches m ON m.id = v.match_id
   WHERE v.match_id = _match_id;
  IF v IS NULL THEN RAISE EXCEPTION 'Veto not started'; END IF;
  IF v.status <> 'in_progress' THEN RAISE EXCEPTION 'Veto is not in progress'; END IF;

  v_signup := CASE WHEN v_side = 'A' THEN v.signup_a_id WHEN v_side = 'B' THEN v.signup_b_id ELSE v.current_turn_signup_id END;
  IF v_signup IS DISTINCT FROM v.current_turn_signup_id AND NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'It is not your turn to act';
  END IF;

  IF v.banned_maps @> to_jsonb(_map) OR v.picked_maps @> to_jsonb(_map) THEN
    RAISE EXCEPTION 'Map already used in this veto';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tournament_map_pool WHERE tournament_id = v.tournament_id AND map_name = _map AND is_active = true) THEN
    RAISE EXCEPTION 'Map not in active pool';
  END IF;

  v_other_signup := CASE WHEN v.current_turn_signup_id = v.signup_a_id THEN v.signup_b_id ELSE v.signup_a_id END;

  UPDATE public.match_map_veto
     SET banned_maps = banned_maps || jsonb_build_array(_map),
         veto_log = veto_log || jsonb_build_array(jsonb_build_object('action','ban','map',_map,'by',v_side,'at',now())),
         current_turn_signup_id = v_other_signup
   WHERE match_id = _match_id;

  PERFORM public._post_match_system_message(_match_id, 'Team ' || v_side || ' banned ' || _map);

  -- Auto-complete BO1 when only 1 left
  SELECT COUNT(*) INTO v_active_count FROM public.tournament_map_pool WHERE tournament_id = v.tournament_id AND is_active = true;
  SELECT COUNT(*) INTO v_remaining
    FROM public.tournament_map_pool p
   WHERE p.tournament_id = v.tournament_id AND p.is_active = true
     AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text((SELECT banned_maps FROM public.match_map_veto WHERE match_id = _match_id)) bm WHERE bm = p.map_name);

  IF v.mode = 'bo1_veto' AND v_remaining = 1 THEN
    PERFORM public._cup_finalize_bo1_remaining(_match_id);
  END IF;
END $$;

-- 13. finalize remaining map
CREATE OR REPLACE FUNCTION public._cup_finalize_bo1_remaining(_match_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_map text; v_tid uuid;
BEGIN
  SELECT tournament_id INTO v_tid FROM public.matches WHERE id = _match_id;
  SELECT p.map_name INTO v_map
    FROM public.tournament_map_pool p
   WHERE p.tournament_id = v_tid AND p.is_active = true
     AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text((SELECT banned_maps FROM public.match_map_veto WHERE match_id = _match_id)) bm WHERE bm = p.map_name)
   LIMIT 1;
  IF v_map IS NULL THEN RETURN; END IF;
  UPDATE public.match_map_veto
     SET selected_map = v_map, status = 'completed', completed_at = now(),
         picked_maps = picked_maps || jsonb_build_array(jsonb_build_object('map', v_map, 'by','remaining')),
         veto_log = veto_log || jsonb_build_array(jsonb_build_object('action','final_pick','map',v_map,'at',now()))
   WHERE match_id = _match_id;
  UPDATE public.matches SET selected_map = v_map, map = v_map, veto_status = 'map_selected' WHERE id = _match_id;
  PERFORM public._post_match_system_message(_match_id, 'Map selected: ' || v_map);
END $$;

-- 14. captain_pick_map (for BO3 picks)
CREATE OR REPLACE FUNCTION public.captain_pick_map(_match_id uuid, _map text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v record; v_side text; v_signup uuid; v_other_signup uuid;
BEGIN
  v_side := public.is_cup_match_captain(auth.uid(), _match_id);
  IF v_side IS NULL AND NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'You can only act on matches involving your team';
  END IF;
  SELECT v.*, m.signup_a_id, m.signup_b_id, m.tournament_id
    INTO v
    FROM public.match_map_veto v
    JOIN public.matches m ON m.id = v.match_id
   WHERE v.match_id = _match_id;
  IF v IS NULL OR v.status <> 'in_progress' THEN RAISE EXCEPTION 'Veto not in progress'; END IF;

  v_signup := CASE WHEN v_side = 'A' THEN v.signup_a_id WHEN v_side = 'B' THEN v.signup_b_id ELSE v.current_turn_signup_id END;
  IF v_signup IS DISTINCT FROM v.current_turn_signup_id AND NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'It is not your turn to act';
  END IF;
  IF v.banned_maps @> to_jsonb(_map) OR v.picked_maps @> to_jsonb(_map) THEN
    RAISE EXCEPTION 'Map already used in this veto';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tournament_map_pool WHERE tournament_id = v.tournament_id AND map_name = _map AND is_active = true) THEN
    RAISE EXCEPTION 'Map not in active pool';
  END IF;

  v_other_signup := CASE WHEN v.current_turn_signup_id = v.signup_a_id THEN v.signup_b_id ELSE v.signup_a_id END;

  UPDATE public.match_map_veto
     SET picked_maps = picked_maps || jsonb_build_array(jsonb_build_object('map',_map,'by',v_side)),
         veto_log = veto_log || jsonb_build_array(jsonb_build_object('action','pick','map',_map,'by',v_side,'at',now())),
         current_turn_signup_id = v_other_signup,
         pick_count = pick_count + 1
   WHERE match_id = _match_id;

  PERFORM public._post_match_system_message(_match_id, 'Team ' || v_side || ' picked ' || _map);
END $$;

-- 15. complete_match_veto (admin force complete or set selected_map)
CREATE OR REPLACE FUNCTION public.complete_match_veto(_match_id uuid, _selected_map text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_map text;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  v_map := _selected_map;
  IF v_map IS NULL THEN
    SELECT selected_map INTO v_map FROM public.match_map_veto WHERE match_id = _match_id;
  END IF;
  UPDATE public.match_map_veto
     SET status = 'completed', completed_at = now(), selected_map = COALESCE(v_map, selected_map)
   WHERE match_id = _match_id;
  UPDATE public.matches SET selected_map = COALESCE(v_map, selected_map), map = COALESCE(v_map, map), veto_status = 'map_selected'
   WHERE id = _match_id;
  PERFORM public._post_match_system_message(_match_id, 'Veto completed by staff. Map: ' || COALESCE(v_map,'(none)'));
END $$;

-- 16. reset_match_veto
CREATE OR REPLACE FUNCTION public.reset_match_veto(_match_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  DELETE FROM public.match_map_veto WHERE match_id = _match_id;
  UPDATE public.matches SET veto_status = 'not_started', selected_map = NULL WHERE id = _match_id;
  PERFORM public._post_match_system_message(_match_id, 'Map veto was reset by staff.');
END $$;

-- 17. submit_cup_match_result
CREATE OR REPLACE FUNCTION public.submit_cup_match_result(_match_id uuid, _score_a integer, _score_b integer, _screenshot text DEFAULT NULL, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_side text;
BEGIN
  v_side := public.is_cup_match_captain(auth.uid(), _match_id);
  IF v_side IS NULL THEN RAISE EXCEPTION 'You can only report results for your own match'; END IF;

  UPDATE public.matches
     SET score_a = _score_a,
         score_b = _score_b,
         result_screenshot_url = COALESCE(_screenshot, result_screenshot_url),
         result_notes = COALESCE(_notes, result_notes),
         reported_by_user_id = auth.uid(),
         submitted_by = auth.uid(),
         submitted_at = now(),
         result_status = 'pending_confirmation'
   WHERE id = _match_id;

  PERFORM public._post_match_system_message(_match_id, 'Result submitted by Team ' || v_side || ' — ' || _score_a || ':' || _score_b || '. Awaiting staff confirmation.');
END $$;

-- 18. admin_confirm_cup_match_result — sets winner, advances bracket
CREATE OR REPLACE FUNCTION public.admin_confirm_cup_match_result(_match_id uuid, _score_a integer DEFAULT NULL, _score_b integer DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE m record; v_a int; v_b int; v_winner_signup uuid; v_winner_team uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT * INTO m FROM public.matches WHERE id = _match_id;
  v_a := COALESCE(_score_a, m.score_a, 0);
  v_b := COALESCE(_score_b, m.score_b, 0);
  IF v_a = v_b THEN RAISE EXCEPTION 'Scores cannot be equal'; END IF;

  v_winner_signup := CASE WHEN v_a > v_b THEN m.signup_a_id ELSE m.signup_b_id END;
  v_winner_team   := CASE WHEN v_a > v_b THEN m.team_a_id ELSE m.team_b_id END;

  UPDATE public.matches
     SET score_a = v_a, score_b = v_b,
         winner_id = v_winner_team,
         status = 'completed',
         result_status = 'admin_resolved',
         confirmed_by = auth.uid(),
         confirmed_at = now(),
         played_at = COALESCE(played_at, now())
   WHERE id = _match_id;

  -- Advance signup to next match if cup
  IF m.next_match_id IS NOT NULL AND v_winner_signup IS NOT NULL THEN
    IF m.next_match_slot = 'a' THEN
      UPDATE public.matches SET signup_a_id = v_winner_signup WHERE id = m.next_match_id;
    ELSE
      UPDATE public.matches SET signup_b_id = v_winner_signup WHERE id = m.next_match_id;
    END IF;
  END IF;

  PERFORM public._post_match_system_message(_match_id, 'Result confirmed by staff — final score ' || v_a || ':' || v_b || '.');
END $$;

-- 19. open_cup_match_dispute
CREATE OR REPLACE FUNCTION public.open_cup_match_dispute(_match_id uuid, _reason text, _description text DEFAULT NULL, _evidence text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_side text;
BEGIN
  v_side := public.is_cup_match_captain(auth.uid(), _match_id);
  IF v_side IS NULL THEN RAISE EXCEPTION 'You can only dispute your own match'; END IF;
  UPDATE public.matches
     SET dispute_status = 'open',
         dispute_reason = _reason,
         result_status = 'disputed'
   WHERE id = _match_id;
  INSERT INTO public.match_disputes (match_id, opened_by, reason, evidence_url)
  VALUES (_match_id, auth.uid(), COALESCE(_reason || ' — ' || COALESCE(_description,''), 'Dispute'), _evidence);
  PERFORM public._post_match_system_message(_match_id, 'Dispute opened by Team ' || v_side || ' — reason: ' || _reason);
END $$;

-- 20. set_cup_match_chat_locked
CREATE OR REPLACE FUNCTION public.set_cup_match_chat_locked(_match_id uuid, _locked boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.matches SET chat_locked = _locked WHERE id = _match_id;
  PERFORM public._post_match_system_message(_match_id, CASE WHEN _locked THEN 'Match chat locked by staff.' ELSE 'Match chat unlocked.' END);
END $$;
