
-- Remove broad public-read policies on profiles to stop email harvesting
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Authenticated users can view profile rows (email column still needs separate protection
-- via column privileges below)
CREATE POLICY "Authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Anonymous (logged-out) visitors can still see public profile data (e.g. leaderboard previews on landing)
-- but never the email column thanks to column privileges below.
CREATE POLICY "Anon can view public profile fields"
ON public.profiles
FOR SELECT
TO anon
USING (true);

-- Revoke email column access from anon and authenticated; only the owner can read it via a dedicated policy/function.
REVOKE SELECT (email) ON public.profiles FROM anon;
REVOKE SELECT (email) ON public.profiles FROM authenticated;

-- Allow the owner to read their own email via a SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_email() TO authenticated;
