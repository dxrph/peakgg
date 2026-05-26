
-- 1) profiles: revoke sensitive columns from anon/authenticated (defense-in-depth alongside RLS)
REVOKE SELECT (email, ip_address, smurf_risk_score, fast_track, fast_track_wins,
               ban_reason, ban_expires_at, warn_count, is_banned)
  ON public.profiles FROM anon, authenticated, PUBLIC;

-- 2) elo_history: restrict detail columns to owner/admin via column privileges
REVOKE SELECT (reason, source_type, old_rank, new_rank)
  ON public.elo_history FROM anon, authenticated, PUBLIC;

-- 3) dispute-evidence bucket → private + scoped policies
UPDATE storage.buckets SET public = false WHERE id = 'dispute-evidence';

DROP POLICY IF EXISTS "Dispute evidence is publicly readable" ON storage.objects;

CREATE POLICY "Dispute evidence readable by owner or staff"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dispute-evidence'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

-- 4) Pin search_path on the only remaining function lacking it
ALTER FUNCTION public.calculate_dynamic_elo_delta(integer, integer, boolean)
  SET search_path = public;
