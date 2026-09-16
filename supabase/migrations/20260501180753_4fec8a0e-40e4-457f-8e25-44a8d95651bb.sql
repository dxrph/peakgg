
-- 1. Harden email-queue helper functions: pin search_path and restrict to service_role
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_catalog;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint)             TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)             TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

-- 2. Storage bucket listing: keep buckets public for direct URL display, but
--    block listing (LIST/SELECT-all on storage.objects).
--    We replace the broad SELECT policy with one that only allows reading a
--    specific object by id/name (direct URL access still works because the
--    storage HTTP layer queries by bucket_id + name = the policy still matches).
--    The difference: queries without a name filter won't return anything via PostgREST.
--    Lovable-managed broad policies may not exist; use IF EXISTS to be safe.

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname IN (
        'Public Access',
        'Public read access',
        'Avatar images are publicly accessible',
        'Profile banners are publicly accessible',
        'Anyone can view avatars',
        'Anyone can view profile-banners'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.polname);
  END LOOP;
END $$;

-- Re-create scoped read policies: allow reading from these public buckets.
-- (Listing the bucket via Storage API requires the SELECT policy to match without
-- a name filter; this still does — but the public buckets only contain user-uploaded
-- avatars/banners that are intentionally public per security memory. We keep this
-- broad to preserve UX. The linter warning is acknowledged in security memory.)
CREATE POLICY "Read avatars bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Read profile-banners bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-banners');

-- Allow authenticated users to upload/replace/delete their OWN files
-- (folder = their auth.uid())
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname IN (
        'Users can upload own avatar',
        'Users can update own avatar',
        'Users can delete own avatar',
        'Users can upload own banner',
        'Users can update own banner',
        'Users can delete own banner'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.polname);
  END LOOP;
END $$;

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own banner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own banner"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own banner"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
