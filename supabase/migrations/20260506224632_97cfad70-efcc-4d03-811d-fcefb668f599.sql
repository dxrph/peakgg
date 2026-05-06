-- Extend tournaments table
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS tier_label text,
  ADD COLUMN IF NOT EXISTS tournament_type text DEFAULT 'official',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS organizer_name text,
  ADD COLUMN IF NOT EXISTS organizer_discord text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS rules_url text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS prize_currency text DEFAULT 'PeakCoins',
  ADD COLUMN IF NOT EXISTS registration_open_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_close_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_open_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_close_at timestamptz,
  ADD COLUMN IF NOT EXISTS min_teams integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS team_size text DEFAULT '5v5',
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Brussels',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS tournaments_slug_unique
  ON public.tournaments(slug) WHERE slug IS NOT NULL;

-- Touch updated_at trigger
DROP TRIGGER IF EXISTS trg_tournaments_touch ON public.tournaments;
CREATE TRIGGER trg_tournaments_touch
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Tournament settings (jsonb buckets)
CREATE TABLE IF NOT EXISTS public.tournament_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL UNIQUE REFERENCES public.tournaments(id) ON DELETE CASCADE,
  eligibility_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  format_settings      jsonb NOT NULL DEFAULT '{}'::jsonb,
  registration_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  map_settings         jsonb NOT NULL DEFAULT '{}'::jsonb,
  schedule_settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  reward_settings      jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility_settings  jsonb NOT NULL DEFAULT '{}'::jsonb,
  moderation_settings  jsonb NOT NULL DEFAULT '{}'::jsonb,
  staff_settings       jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_notes          text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads tournament settings"
  ON public.tournament_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage tournament settings"
  ON public.tournament_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role));

DROP TRIGGER IF EXISTS trg_tournament_settings_touch ON public.tournament_settings;
CREATE TRIGGER trg_tournament_settings_touch
  BEFORE UPDATE ON public.tournament_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();