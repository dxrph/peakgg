ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS preferred_team_type text;