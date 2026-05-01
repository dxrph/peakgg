CREATE TABLE public.elo_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game TEXT NOT NULL,
  match_id UUID,
  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'match',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_elo_history_user_created ON public.elo_history (user_id, created_at DESC);
CREATE INDEX idx_elo_history_match ON public.elo_history (match_id);

ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view elo history"
ON public.elo_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert elo history"
ON public.elo_history
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));