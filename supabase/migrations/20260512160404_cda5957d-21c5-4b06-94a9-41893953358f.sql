
-- Tournament additional config
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS discord_url text,
  ADD COLUMN IF NOT EXISTS countdown_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS match_format_default text NOT NULL DEFAULT 'BO1',
  ADD COLUMN IF NOT EXISTS match_format_final text NOT NULL DEFAULT 'BO3',
  ADD COLUMN IF NOT EXISTS map_selection_mode text NOT NULL DEFAULT 'admin_manual',
  ADD COLUMN IF NOT EXISTS result_confirmation_mode text NOT NULL DEFAULT 'admin_manual',
  ADD COLUMN IF NOT EXISTS third_place_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS forfeit_grace_minutes integer NOT NULL DEFAULT 10;

-- Signup permanent-team interest
ALTER TABLE public.tournament_team_signups
  ADD COLUMN IF NOT EXISTS wants_permanent_team boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permanent_team_request_note text;

-- Map pool table
CREATE TABLE IF NOT EXISTS public.tournament_map_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  map_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, map_name)
);
CREATE INDEX IF NOT EXISTS idx_tmp_tournament ON public.tournament_map_pool(tournament_id);

ALTER TABLE public.tournament_map_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Map pool active maps public read" ON public.tournament_map_pool;
CREATE POLICY "Map pool active maps public read"
  ON public.tournament_map_pool FOR SELECT
  USING (is_active = true OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

DROP POLICY IF EXISTS "Admins manage map pool" ON public.tournament_map_pool;
CREATE POLICY "Admins manage map pool"
  ON public.tournament_map_pool FOR ALL
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_tmp_touch ON public.tournament_map_pool;
CREATE TRIGGER trg_tmp_touch BEFORE UPDATE ON public.tournament_map_pool
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Match veto table
CREATE TABLE IF NOT EXISTS public.match_map_veto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'admin_manual',
  status text NOT NULL DEFAULT 'not_started',
  current_turn_team_id uuid,
  selected_map text,
  banned_maps jsonb NOT NULL DEFAULT '[]'::jsonb,
  picked_maps jsonb NOT NULL DEFAULT '[]'::jsonb,
  veto_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id)
);
CREATE INDEX IF NOT EXISTS idx_mmv_tournament ON public.match_map_veto(tournament_id);

ALTER TABLE public.match_map_veto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Match veto public read" ON public.match_map_veto;
CREATE POLICY "Match veto public read"
  ON public.match_map_veto FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage match veto" ON public.match_map_veto;
CREATE POLICY "Admins manage match veto"
  ON public.match_map_veto FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

DROP TRIGGER IF EXISTS trg_mmv_touch ON public.match_map_veto;
CREATE TRIGGER trg_mmv_touch BEFORE UPDATE ON public.match_map_veto
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
