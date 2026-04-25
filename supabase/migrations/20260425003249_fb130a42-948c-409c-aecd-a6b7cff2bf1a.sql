-- 1. Add banner_url column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url text;

-- 2. Create profile-banners bucket (public, 5MB, image types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-banners',
  'profile-banners',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Storage policies on storage.objects scoped to this bucket
DROP POLICY IF EXISTS "Profile banners are publicly viewable" ON storage.objects;
CREATE POLICY "Profile banners are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-banners');

DROP POLICY IF EXISTS "Users can upload own profile banner" ON storage.objects;
CREATE POLICY "Users can upload own profile banner"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-banners'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own profile banner" ON storage.objects;
CREATE POLICY "Users can update own profile banner"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-banners'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own profile banner" ON storage.objects;
CREATE POLICY "Users can delete own profile banner"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-banners'
  AND auth.uid()::text = (storage.foldername(name))[1]
);