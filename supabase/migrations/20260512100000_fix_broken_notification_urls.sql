-- Backfill: clean any stale notifications that point at /matches/undefined or /matches/null.
-- Where possible, rebuild the URL from entity_id; otherwise null it out so the UI shows no broken CTA.
UPDATE public.notifications
SET action_url = CASE
  WHEN entity_type = 'match' AND entity_id IS NOT NULL
    THEN '/matches/' || entity_id::text
  ELSE NULL
END
WHERE action_url ILIKE '%/matches/undefined%'
   OR action_url ILIKE '%/matches/null%';
