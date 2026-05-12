
-- 1. Insert the Community Cup #1 tournament
INSERT INTO public.tournaments (
  name, slug, game, tier, tier_label, format, status, max_teams, min_teams,
  bo, bracket_type, entry_type, tournament_type, visibility, featured,
  team_size, language, timezone, organizer_name,
  short_description, description, prize_pool, prize_currency,
  start_date, registration_open_at
) VALUES (
  'PeakGG Community Cup #1',
  'community-cup-1',
  'valorant',
  1,
  'Community Cup',
  '5v5',
  'registration_open',
  16,
  8,
  'BO1',
  'single_elim',
  'open',
  'community_cup',
  'public',
  true,
  '5v5',
  'en',
  'Europe/Brussels',
  'PeakGG Staff',
  'Free EU VALORANT tournament for community teams, amateur players and rising 5-stacks.',
  'Bring your 5-stack. Represent your community. Fight for the first PeakGG Community Cup title. Single elimination, BO1 until the Grand Final (BO3). 8-16 teams, EU servers, English communication.',
  'Community Cup Trophy + PeakGG Champion Badge',
  'Recognition',
  now() + interval '21 days',
  now()
) ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
  featured = true,
  status = EXCLUDED.status,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  tournament_type = EXCLUDED.tournament_type,
  updated_at = now();

-- 2. Tournament team signups (rich registration data)
CREATE TABLE IF NOT EXISTS public.tournament_team_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  captain_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  team_name text NOT NULL,
  team_tag text,
  team_logo_url text,
  community_name text NOT NULL,
  community_discord_url text,
  country_language text NOT NULL,
  average_rank text,
  captain_name text NOT NULL,
  captain_discord text NOT NULL,
  captain_email text NOT NULL,
  captain_riot_id text NOT NULL,
  player_1_riot_id text NOT NULL,
  player_2_riot_id text NOT NULL,
  player_3_riot_id text NOT NULL,
  player_4_riot_id text NOT NULL,
  player_5_riot_id text NOT NULL,
  substitute_1_riot_id text,
  substitute_2_riot_id text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  checked_in_at timestamptz,
  admin_note text,
  agreement_available boolean NOT NULL DEFAULT false,
  agreement_discord boolean NOT NULL DEFAULT false,
  agreement_rules boolean NOT NULL DEFAULT false,
  agreement_forfeit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_team_signups_status_chk
    CHECK (status IN ('pending','approved','rejected','waitlisted','checked_in','eliminated','champion'))
);

CREATE INDEX IF NOT EXISTS idx_tts_tournament ON public.tournament_team_signups(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tts_captain ON public.tournament_team_signups(captain_user_id);
CREATE INDEX IF NOT EXISTS idx_tts_status ON public.tournament_team_signups(status);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_tts_touch ON public.tournament_team_signups;
CREATE TRIGGER trg_tts_touch
BEFORE UPDATE ON public.tournament_team_signups
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.tournament_team_signups ENABLE ROW LEVEL SECURITY;

-- Captains: view own
DROP POLICY IF EXISTS "Captain can view own signup" ON public.tournament_team_signups;
CREATE POLICY "Captain can view own signup"
ON public.tournament_team_signups
FOR SELECT TO authenticated
USING (captain_user_id = auth.uid());

-- Public-safe view: only approved/checked_in/champion, exposes safe fields only
CREATE OR REPLACE VIEW public.tournament_team_signups_public AS
SELECT
  s.id,
  s.tournament_id,
  s.team_name,
  s.team_tag,
  s.team_logo_url,
  s.community_name,
  s.country_language,
  s.average_rank,
  s.status,
  s.checked_in_at,
  s.created_at
FROM public.tournament_team_signups s
WHERE s.status IN ('approved','checked_in','eliminated','champion');

GRANT SELECT ON public.tournament_team_signups_public TO anon, authenticated;

-- Captain insert: must be authenticated, set self as captain, tournament must be in open registration
DROP POLICY IF EXISTS "Captain can register" ON public.tournament_team_signups;
CREATE POLICY "Captain can register"
ON public.tournament_team_signups
FOR INSERT TO authenticated
WITH CHECK (
  captain_user_id = auth.uid()
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_id
      AND t.status = 'registration_open'
  )
);

-- Captain update: only own, only while pending; cannot change status
DROP POLICY IF EXISTS "Captain can edit pending signup" ON public.tournament_team_signups;
CREATE POLICY "Captain can edit pending signup"
ON public.tournament_team_signups
FOR UPDATE TO authenticated
USING (captain_user_id = auth.uid() AND status = 'pending')
WITH CHECK (captain_user_id = auth.uid() AND status = 'pending');

-- Admin/mod full access
DROP POLICY IF EXISTS "Staff full access" ON public.tournament_team_signups;
CREATE POLICY "Staff full access"
ON public.tournament_team_signups
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- Captain self-checkin RPC: only own, only if approved + tournament in checkin
CREATE OR REPLACE FUNCTION public.community_cup_checkin(_signup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE s record; t record;
BEGIN
  SELECT * INTO s FROM public.tournament_team_signups WHERE id = _signup_id;
  IF s IS NULL THEN RAISE EXCEPTION 'Signup not found'; END IF;
  IF s.captain_user_id <> auth.uid() THEN RAISE EXCEPTION 'Not your team'; END IF;
  IF s.status <> 'approved' THEN RAISE EXCEPTION 'Team is not approved'; END IF;
  SELECT * INTO t FROM public.tournaments WHERE id = s.tournament_id;
  IF t.status NOT IN ('checkin','checkin_open') THEN RAISE EXCEPTION 'Check-in is not open'; END IF;
  UPDATE public.tournament_team_signups
     SET status = 'checked_in', checked_in_at = now()
   WHERE id = _signup_id;
END $$;
