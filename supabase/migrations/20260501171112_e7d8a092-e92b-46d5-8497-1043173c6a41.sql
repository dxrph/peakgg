-- Waitlist: replace overly permissive INSERT with format/length validation
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

CREATE POLICY "Anyone can join waitlist with valid email"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 3 AND 255
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Clips: restrict reads to authenticated users only
DROP POLICY IF EXISTS "Anyone can view clips" ON public.clips;

CREATE POLICY "Authenticated users can view clips"
  ON public.clips FOR SELECT
  TO authenticated
  USING (true);