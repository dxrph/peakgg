-- Remove any pre-existing duplicates keeping the earliest vote
DELETE FROM public.reputation_votes a
USING public.reputation_votes b
WHERE a.ctid < b.ctid
  AND a.voter_id = b.voter_id
  AND a.player_id = b.player_id
  AND a.match_id = b.match_id;

-- Enforce one vote per (voter, player, match)
CREATE UNIQUE INDEX IF NOT EXISTS reputation_votes_unique_voter_player_match
  ON public.reputation_votes (voter_id, player_id, match_id);

-- Disallow self-voting at the DB level too (defense in depth)
ALTER TABLE public.reputation_votes
  DROP CONSTRAINT IF EXISTS reputation_votes_no_self;
ALTER TABLE public.reputation_votes
  ADD CONSTRAINT reputation_votes_no_self CHECK (voter_id <> player_id);

-- Validate score ranges 1..5
ALTER TABLE public.reputation_votes
  DROP CONSTRAINT IF EXISTS reputation_votes_scores_range;
ALTER TABLE public.reputation_votes
  ADD CONSTRAINT reputation_votes_scores_range CHECK (
    communication BETWEEN 1 AND 5 AND
    fairplay BETWEEN 1 AND 5 AND
    punctuality BETWEEN 1 AND 5
  );