-- Keep sensitive profile fields private from other authenticated users and
-- ensure match disputes are visible only to participants/staff.

revoke select on table public.profiles from authenticated;
grant select (
  id, username, display_name, avatar_url, bio, region, created_at, updated_at,
  discord_username, preferred_game, banner_url, language, looking_for_team,
  trophies, game, rank, role, reputation_score, fast_track, fast_track_wins,
  last_active_at, account_verified, availability, preferred_team_type
) on table public.profiles to authenticated;

drop policy if exists "Anyone reads disputes" on public.match_disputes;
create policy "Match participants and staff read disputes"
on public.match_disputes
for select to authenticated
using (
  public.can_access_match_chat(auth.uid(), match_id)
  or public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'moderator')
);
