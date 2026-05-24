// Feature flags — flip these to enable/disable features platform-wide.
// Keep these simple booleans so they're easy to toggle for launches.

export const openCupPublicQueueEnabled = true;
export const rankedPublicBetaEnabled = true;

// ---------------------------------------------------------------------------
// Valorant-only closed beta
// ---------------------------------------------------------------------------
// PeakGG is currently focused on a Valorant-only closed beta. Other games
// (CS2, R6S), placeholder widgets and "Coming Soon" surfaces are hidden via
// these flags. Flip back to `false` to restore the multi-game UI.

export const valorantOnlyBeta = true;

/** Game IDs surfaced in public UI while `valorantOnlyBeta` is enabled. */
export const enabledGameIds: ReadonlyArray<"valorant" | "cs2" | "r6s"> =
  valorantOnlyBeta ? ["valorant"] : ["valorant", "cs2", "r6s"];

/** Hide marketing cards, feature pills and shortcuts marked "coming soon". */
export const hideComingSoonSurfaces = valorantOnlyBeta;

/** Hide empty placeholder widgets (Clip of the Week, Coach Marketplace, AI Studio). */
export const hideEmptyPlaceholders = valorantOnlyBeta;

// ---------------------------------------------------------------------------
// Unified Competitive Queue config
// ---------------------------------------------------------------------------
// One config powers Open Cup + Ranked + future modes. The current public
// surface runs at teamSize = 1 to validate the queue/match/ELO loop end-to-end.
// Flipping `teamSize` to 5 (and `allowParty` / `allowFullTeam` to true) is the
// only change required to switch to the 5v5 solo queue — the matchmaking RPC,
// match_rosters, Match Room and ELO pipeline are all size-agnostic.

export type QueueMode = "open_cup" | "ranked";

export interface CompetitiveQueueConfig {
  mode: QueueMode;
  teamSize: 1 | 5;
  requiredPlayers: number; // teamSize * 2
  allowSolo: boolean;
  allowParty: boolean;
  allowFullTeam: boolean;
  autoFillMissingPlayers: boolean;
  enabled: boolean;
}

const baseQueueDefaults = {
  teamSize: 1 as const,
  allowSolo: true,
  allowParty: false,
  allowFullTeam: false,
  autoFillMissingPlayers: true,
};

export const competitiveQueues: Record<QueueMode, CompetitiveQueueConfig> = {
  open_cup: {
    mode: "open_cup",
    ...baseQueueDefaults,
    requiredPlayers: baseQueueDefaults.teamSize * 2,
    enabled: openCupPublicQueueEnabled,
  },
  ranked: {
    mode: "ranked",
    ...baseQueueDefaults,
    requiredPlayers: baseQueueDefaults.teamSize * 2,
    enabled: rankedPublicBetaEnabled,
  },
};

// Back-compat exports used by older imports.
export const openCupTeamSize: 1 | 5 = competitiveQueues.open_cup.teamSize;
export const openCupQueueMode: "test_1v1" | "public_5v5" =
  competitiveQueues.open_cup.teamSize === 1 ? "test_1v1" : "public_5v5";