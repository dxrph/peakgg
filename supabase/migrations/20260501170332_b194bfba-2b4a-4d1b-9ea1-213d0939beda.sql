-- Waitlist table
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS public.waitlist_position_seq START 1;
ALTER TABLE public.waitlist ALTER COLUMN position SET DEFAULT nextval('public.waitlist_position_seq');

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage waitlist"
  ON public.waitlist FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Clips table
CREATE TABLE public.clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid,
  title text NOT NULL,
  video_url text,
  votes integer NOT NULL DEFAULT 0,
  week text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clips"
  ON public.clips FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert clips"
  ON public.clips FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update clips"
  ON public.clips FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete clips"
  ON public.clips FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));