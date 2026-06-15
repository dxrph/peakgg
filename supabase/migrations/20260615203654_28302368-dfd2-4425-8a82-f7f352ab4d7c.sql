DROP POLICY IF EXISTS "Authenticated reads tournament settings" ON public.tournament_settings;
CREATE POLICY "Staff reads tournament settings"
ON public.tournament_settings
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR has_role(auth.uid(), 'organizer'::app_role)
);