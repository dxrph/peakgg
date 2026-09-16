ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS map_selection_mode text NOT NULL DEFAULT 'admin_manual';

CREATE INDEX IF NOT EXISTS idx_matches_map_selection_mode ON public.matches(map_selection_mode);