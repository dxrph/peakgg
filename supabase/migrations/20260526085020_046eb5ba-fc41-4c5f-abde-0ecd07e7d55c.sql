
-- Re-grant to authenticated (in case earlier revoke removed it for the admin role)
GRANT SELECT (email, ip_address, smurf_risk_score, fast_track, fast_track_wins,
              ban_reason, ban_expires_at, warn_count, is_banned)
  ON public.profiles TO authenticated;

-- Keep anon locked out of these sensitive columns
REVOKE SELECT (email, ip_address, smurf_risk_score, fast_track, fast_track_wins,
               ban_reason, ban_expires_at, warn_count, is_banned)
  ON public.profiles FROM anon;
