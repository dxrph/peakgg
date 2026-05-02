-- New table: scrim_requests (separate from existing `scrims` open-board table)
CREATE TABLE IF NOT EXISTS public.scrim_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_team_id UUID NOT NULL,
  target_team_id UUID,
  game TEXT NOT NULL DEFAULT 'valorant',
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  format TEXT NOT NULL DEFAULT '5v5 BO1',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_scrim_requests_challenger ON public.scrim_requests(challenger_team_id);
CREATE INDEX IF NOT EXISTS idx_scrim_requests_target ON public.scrim_requests(target_team_id);
CREATE INDEX IF NOT EXISTS idx_scrim_requests_status ON public.scrim_requests(status);

-- Enable RLS
ALTER TABLE public.scrim_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view scrim requests"
ON public.scrim_requests
FOR SELECT
USING (true);

CREATE POLICY "Challenger team owner can create"
ON public.scrim_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = scrim_requests.challenger_team_id
      AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "Challenger team owner can update"
ON public.scrim_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = scrim_requests.challenger_team_id
      AND t.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = scrim_requests.challenger_team_id
      AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "Challenger team owner can delete"
ON public.scrim_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = scrim_requests.challenger_team_id
      AND t.owner_id = auth.uid()
  )
);