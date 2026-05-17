
CREATE OR REPLACE FUNCTION public.confirm_match_result(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record; _winner uuid; _div uuid;
BEGIN
  SELECT * INTO _m FROM public.matches WHERE id = _match_id;
  IF _m IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF _m.result_status NOT IN ('pending_confirmation','awaiting_result') THEN
    RAISE EXCEPTION 'Match is not pending confirmation';
  END IF;

  -- Captain authorization: opponent of submitter
  IF _m.confirmation_team_id IS NOT NULL THEN
    IF NOT is_team_captain(auth.uid(), _m.confirmation_team_id) THEN
      RAISE EXCEPTION 'Only the opposing captain can confirm';
    END IF;
  ELSE
    -- Legacy path: any captain of the non-submitting team
    IF NOT (
      (is_team_captain(auth.uid(), _m.team_a_id) AND _m.submitted_by <> auth.uid())
      OR (is_team_captain(auth.uid(), _m.team_b_id) AND _m.submitted_by <> auth.uid())
    ) THEN
      RAISE EXCEPTION 'Only the opposing captain can confirm';
    END IF;
  END IF;

  _winner := CASE WHEN _m.score_a > _m.score_b THEN _m.team_a_id
                  WHEN _m.score_b > _m.score_a THEN _m.team_b_id
                  ELSE NULL END;

  UPDATE public.matches
     SET result_status = 'confirmed', status = 'completed',
         winner_id = _winner, confirmed_at = now(),
         confirmed_by = auth.uid(), played_at = COALESCE(played_at, now())
   WHERE id = _match_id;

  -- Advance bracket
  IF _m.next_match_id IS NOT NULL AND _winner IS NOT NULL THEN
    IF _m.next_match_slot = 'a' THEN
      UPDATE public.matches SET team_a_id = _winner WHERE id = _m.next_match_id;
    ELSIF _m.next_match_slot = 'b' THEN
      UPDATE public.matches SET team_b_id = _winner WHERE id = _m.next_match_id;
    END IF;
  END IF;

  -- Standings: try both recompute paths
  IF _m.division_id IS NOT NULL THEN
    BEGIN
      PERFORM public.recompute_standings_for_division(_m.division_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  IF _m.season_id IS NOT NULL THEN
    BEGIN
      PERFORM public.recalculate_league_standings(_m.season_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END; $$;

-- Update standings recalc to consider 'confirmed' status too
CREATE OR REPLACE FUNCTION public.recalculate_league_standings(_season_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _div_id uuid;
BEGIN
  SELECT id INTO _div_id FROM public.league_divisions
   WHERE season_id = _season_id ORDER BY tier ASC LIMIT 1;

  IF _div_id IS NULL THEN
    INSERT INTO public.league_divisions(season_id, tier, name)
    VALUES (_season_id, 1, 'Main') RETURNING id INTO _div_id;
  END IF;

  DELETE FROM public.league_standings WHERE division_id = _div_id;

  INSERT INTO public.league_standings(division_id, team_id, played, wins, draws, losses, points, round_diff, form, updated_at)
  SELECT
    _div_id,
    t.team_id,
    COUNT(*) FILTER (WHERE m.id IS NOT NULL),
    COUNT(*) FILTER (WHERE m.winner_id = t.team_id),
    0,
    COUNT(*) FILTER (WHERE m.winner_id IS NOT NULL AND m.winner_id <> t.team_id),
    COUNT(*) FILTER (WHERE m.winner_id = t.team_id) * 3,
    COALESCE(SUM(
      CASE
        WHEN m.team_a_id = t.team_id THEN COALESCE(m.rounds_a, m.score_a, 0) - COALESCE(m.rounds_b, m.score_b, 0)
        WHEN m.team_b_id = t.team_id THEN COALESCE(m.rounds_b, m.score_b, 0) - COALESCE(m.rounds_a, m.score_a, 0)
        ELSE 0
      END
    ), 0),
    COALESCE((
      SELECT array_agg(CASE WHEN winner_id = t.team_id THEN 'W' ELSE 'L' END ORDER BY played_at DESC)
      FROM (
        SELECT winner_id, played_at FROM public.matches
        WHERE season_id = _season_id
          AND stage IN ('regular_season')
          AND result_status IN ('completed','confirmed','admin_resolved')
          AND (team_a_id = t.team_id OR team_b_id = t.team_id)
        ORDER BY played_at DESC NULLS LAST LIMIT 5
      ) recent
    ), '{}'::text[]),
    now()
  FROM (
    SELECT team_id FROM public.league_registrations
    WHERE season_id = _season_id AND status = 'approved'
  ) t
  LEFT JOIN public.matches m
    ON m.season_id = _season_id
   AND m.stage IN ('regular_season')
   AND m.result_status IN ('completed','confirmed','admin_resolved')
   AND (m.team_a_id = t.team_id OR m.team_b_id = t.team_id)
  GROUP BY t.team_id;

  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, round_diff DESC) AS pos
    FROM public.league_standings WHERE division_id = _div_id
  )
  UPDATE public.league_standings s SET position = r.pos
  FROM ranked r WHERE r.id = s.id;
END;
$$;
