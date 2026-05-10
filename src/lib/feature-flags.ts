// Feature flags — flip these to enable/disable features platform-wide.
// Keep these simple booleans so they're easy to toggle for launches.

/**
 * When false, the public "Join Open Cup" matchmaking CTA is hidden and
 * replaced with a Discord invite. Admins still see the live queue widget
 * for end-to-end testing.
 * Flip to `true` after the 2-account ELO flow has been verified.
 */
export const openCupPublicQueueEnabled = true;

/**
 * Public Beta — exposes Ranked routes/CTAs. During beta the Ranked flow
 * shares the Open Cup test queue (1v1) — see /tournaments.
 */
export const rankedPublicBetaEnabled = true;

/**
 * Open Cup team size. 1 = current 1v1 test queue. 5 = future public 5v5
 * solo queue. Switching this value (plus copy on /tournaments) is the only
 * change required to flip Open Cup to 5v5 — the queue RPC, match_rosters,
 * Match Room and ELO pipeline are all size-agnostic.
 */
export const openCupTeamSize: 1 | 5 = 1;

/** "test_1v1" while openCupTeamSize === 1, "public_5v5" otherwise. */
export const openCupQueueMode: "test_1v1" | "public_5v5" =
  openCupTeamSize === 1 ? "test_1v1" : "public_5v5";