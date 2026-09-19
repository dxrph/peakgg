-- Only the trusted match processor may claim ELO processing.
-- GRANT to service_role alone does not remove PostgreSQL's default PUBLIC grant.
REVOKE EXECUTE ON FUNCTION public.claim_match_for_elo(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_match_for_elo(uuid) TO service_role;
