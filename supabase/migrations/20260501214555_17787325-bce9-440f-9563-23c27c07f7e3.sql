
DROP POLICY IF EXISTS "Admins can update submissions" ON public.contact_submissions;

CREATE POLICY "Mods and admins can update submissions"
  ON public.contact_submissions
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
