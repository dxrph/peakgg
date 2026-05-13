DO $$
DECLARE
  team_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO team_ids FROM public.teams;
  IF team_ids IS NULL THEN RETURN; END IF;

  -- Wipe dependent data referencing teams
  DELETE FROM public.team_chat_messages WHERE team_id = ANY(team_ids);
  DELETE FROM public.team_messages WHERE team_id = ANY(team_ids);
  DELETE FROM public.team_join_requests WHERE team_id = ANY(team_ids);
  DELETE FROM public.team_members WHERE team_id = ANY(team_ids);

  -- Optional refs in other tables (null them out where columns exist)
  UPDATE public.matches SET team_a_id = NULL WHERE team_a_id = ANY(team_ids);
  UPDATE public.matches SET team_b_id = NULL WHERE team_b_id = ANY(team_ids);
  UPDATE public.match_rosters SET team_id = NULL WHERE team_id = ANY(team_ids);

  DELETE FROM public.match_ready_checks WHERE team_id = ANY(team_ids);
  DELETE FROM public.match_results WHERE submitted_by_team_id = ANY(team_ids);
  DELETE FROM public.match_disputes WHERE opened_by_team_id = ANY(team_ids);

  DELETE FROM public.coach_notes WHERE team_id = ANY(team_ids);
  DELETE FROM public.chat_mutes WHERE team_id = ANY(team_ids);
  DELETE FROM public.league_registrations WHERE team_id = ANY(team_ids);
  DELETE FROM public.league_standings WHERE team_id = ANY(team_ids);
  UPDATE public.league_seasons SET champion_team_id = NULL WHERE champion_team_id = ANY(team_ids);
  UPDATE public.competitive_queue_groups SET permanent_team_id = NULL WHERE permanent_team_id = ANY(team_ids);

  DELETE FROM public.teams WHERE id = ANY(team_ids);
END $$;