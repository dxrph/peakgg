
-- Admin sandbox: create isolated demo match for end-to-end testing
CREATE OR REPLACE FUNCTION public.admin_create_sandbox_match(_mode text DEFAULT 'bo1_veto')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tid uuid;
  v_a uuid;
  v_b uuid;
  v_mid uuid;
  v_suffix text;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  v_suffix := to_char(now(), 'HH24MISS');

  -- Find or create the dedicated sandbox tournament
  SELECT id INTO v_tid FROM public.tournaments WHERE slug = 'sandbox-test-cup' LIMIT 1;
  IF v_tid IS NULL THEN
    INSERT INTO public.tournaments
      (name, slug, game, status, max_teams, visibility, map_selection_mode, match_format_default, match_format_final)
    VALUES
      ('[SANDBOX] Match-Day Test', 'sandbox-test-cup', 'valorant', 'draft', 8, 'unlisted', _mode, 'BO1', 'BO3')
    RETURNING id INTO v_tid;

    -- Seed a default map pool for the sandbox tournament
    INSERT INTO public.tournament_map_pool (tournament_id, map_name, is_active, display_order)
    VALUES
      (v_tid, 'Ascent', true, 1),
      (v_tid, 'Bind', true, 2),
      (v_tid, 'Haven', true, 3),
      (v_tid, 'Split', true, 4),
      (v_tid, 'Lotus', true, 5),
      (v_tid, 'Sunset', true, 6),
      (v_tid, 'Pearl', true, 7)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create two checked-in sandbox signups
  INSERT INTO public.tournament_team_signups
    (tournament_id, status, team_name, team_tag, community_name, country_language,
     captain_name, captain_discord, captain_email, captain_riot_id,
     player_1_riot_id, player_2_riot_id, player_3_riot_id, player_4_riot_id, player_5_riot_id,
     agreement_available, agreement_discord, agreement_rules, agreement_forfeit, checked_in_at)
  VALUES
    (v_tid, 'checked_in', '[SBX-A] Alpha ' || v_suffix, 'SBXA', 'Sandbox Community', 'EN',
     'Alpha Captain', 'alpha#0001', 'sandbox+a@peakgg.local', 'AlphaCap#EUW',
     'A1#EUW','A2#EUW','A3#EUW','A4#EUW','A5#EUW',
     true, true, true, true, now())
  RETURNING id INTO v_a;

  INSERT INTO public.tournament_team_signups
    (tournament_id, status, team_name, team_tag, community_name, country_language,
     captain_name, captain_discord, captain_email, captain_riot_id,
     player_1_riot_id, player_2_riot_id, player_3_riot_id, player_4_riot_id, player_5_riot_id,
     agreement_available, agreement_discord, agreement_rules, agreement_forfeit, checked_in_at)
  VALUES
    (v_tid, 'checked_in', '[SBX-B] Bravo ' || v_suffix, 'SBXB', 'Sandbox Community', 'EN',
     'Bravo Captain', 'bravo#0001', 'sandbox+b@peakgg.local', 'BravoCap#EUW',
     'B1#EUW','B2#EUW','B3#EUW','B4#EUW','B5#EUW',
     true, true, true, true, now())
  RETURNING id INTO v_b;

  -- Create the demo match
  INSERT INTO public.matches
    (tournament_id, signup_a_id, signup_b_id, round, bracket_position,
     status, result_status, is_demo, kind, game, bo_format, veto_status)
  VALUES
    (v_tid, v_a, v_b, 1, 1, 'scheduled', 'scheduled', true, 'community_cup', 'valorant', 'BO1', 'not_started')
  RETURNING id INTO v_mid;

  RETURN v_mid;
END $$;

-- Admin-only: submit a result on behalf of a side (sandbox/testing)
CREATE OR REPLACE FUNCTION public.admin_simulate_cup_match_result(
  _match_id uuid, _score_a integer, _score_b integer, _as_side text DEFAULT 'A'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE public.matches
     SET score_a = _score_a,
         score_b = _score_b,
         reported_by_user_id = auth.uid(),
         submitted_by = auth.uid(),
         submitted_at = now(),
         result_status = 'pending_confirmation'
   WHERE id = _match_id;

  PERFORM public._post_match_system_message(
    _match_id,
    '[SANDBOX] Result submitted by Team ' || _as_side || ' — ' || _score_a || ':' || _score_b
  );
END $$;

-- Admin-only: open a dispute on behalf of a side (sandbox/testing)
CREATE OR REPLACE FUNCTION public.admin_simulate_cup_match_dispute(
  _match_id uuid, _reason text, _as_side text DEFAULT 'A'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE public.matches
     SET dispute_status = 'open',
         dispute_reason = _reason,
         result_status = 'disputed'
   WHERE id = _match_id;

  INSERT INTO public.match_disputes (match_id, opened_by, opened_by_team_id, reason)
  VALUES (_match_id, auth.uid(), NULL, '[SANDBOX] ' || _reason);

  PERFORM public._post_match_system_message(
    _match_id,
    '[SANDBOX] Dispute opened by Team ' || _as_side || ' — reason: ' || _reason
  );
END $$;

-- Admin-only: cleanup all sandbox data (matches, signups, tournament)
CREATE OR REPLACE FUNCTION public.admin_cleanup_sandbox()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_tid uuid;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT id INTO v_tid FROM public.tournaments WHERE slug = 'sandbox-test-cup' LIMIT 1;
  IF v_tid IS NULL THEN RETURN; END IF;

  DELETE FROM public.match_disputes WHERE match_id IN (SELECT id FROM public.matches WHERE tournament_id = v_tid);
  DELETE FROM public.match_chat_messages WHERE match_id IN (SELECT id FROM public.matches WHERE tournament_id = v_tid);
  DELETE FROM public.match_map_veto WHERE match_id IN (SELECT id FROM public.matches WHERE tournament_id = v_tid);
  DELETE FROM public.matches WHERE tournament_id = v_tid;
  DELETE FROM public.tournament_team_signups WHERE tournament_id = v_tid;
  DELETE FROM public.tournament_map_pool WHERE tournament_id = v_tid;
  DELETE FROM public.tournaments WHERE id = v_tid;
END $$;
