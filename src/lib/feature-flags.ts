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