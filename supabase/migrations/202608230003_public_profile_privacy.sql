-- Prevent anonymous clients from selecting private profile columns.
-- RLS controls rows, not columns, so a permissive public-row policy must be
-- paired with column-level privileges for the anon role.

revoke select on table public.profiles from anon;
grant select (
  id,
  username,
  avatar_url,
  bio,
  region,
  looking_for_team,
  availability,
  created_at,
  updated_at
) on table public.profiles to anon;
