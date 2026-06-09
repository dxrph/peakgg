
-- 1) Profiles: revoke broad SELECT from anon/public, grant only safe public columns to anon
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM PUBLIC;

GRANT SELECT (
  id, username, display_name, avatar_url, bio, region,
  created_at, updated_at, discord_username, peak_coins,
  preferred_game, banner_url, language, looking_for_team,
  trophies, game, rank, role, reputation_score,
  last_active_at, account_verified, availability, preferred_team_type
) ON public.profiles TO anon;

GRANT SELECT ON public.profiles TO authenticated;

-- 2) tournament_settings: restrict reads to authenticated
DROP POLICY IF EXISTS "Anyone reads tournament settings" ON public.tournament_settings;
CREATE POLICY "Authenticated reads tournament settings"
  ON public.tournament_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- 3) match_rosters: prevent bypass when team_id is NULL
DROP POLICY IF EXISTS "Captain manages rosters" ON public.match_rosters;
CREATE POLICY "Captain manages rosters"
  ON public.match_rosters
  FOR ALL
  TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_captain(auth.uid(), team_id))
  WITH CHECK (team_id IS NOT NULL AND public.is_team_captain(auth.uid(), team_id));
