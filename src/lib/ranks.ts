// PeakGG Rank System — platform-wide, game-agnostic
// 7-tier system (per project knowledge):
//   Rookie → Contender → Rival → Expert → Elite → Master → Apex
//
// Brand palette: matte black + white, red/orange accents on the high tiers.
// Apex is the only tier that gets a multi-stop gradient (red → orange → gold).
//
// Legacy 10-tier names (Iron / Bronze / Silver / Gold / Platinum / Diamond)
// are still accepted by getRankByName so any data persisted under the old
// labels keeps resolving to a sensible tier instead of falling back to Rookie.

export type RankTier =
  | "Rookie"
  | "Contender"
  | "Rival"
  | "Expert"
  | "Elite"
  | "Master"
  | "Apex";

export interface RankInfo {
  tier: number;
  name: RankTier;
  minElo: number;
  maxElo: number;
  /** HSL triplet for CSS vars / tailwind arbitrary values (e.g. `hsl(${rank.color})`). */
  color: string;
  /** Primary hex used by the badge SVG and inline styles. */
  hex: string;
  /** Optional CSS gradient — only Apex sets this for its legendary corona. */
  gradient?: string;
}

export const RANKS: RankInfo[] = [
  { tier: 1, name: "Rookie",    minElo: 0,    maxElo: 499,   color: "220 9% 55%",  hex: "#6B7280" },
  { tier: 2, name: "Contender", minElo: 500,  maxElo: 999,   color: "215 14% 65%", hex: "#9CA3AF" },
  { tier: 3, name: "Rival",     minElo: 1000, maxElo: 1499,  color: "25 55% 52%",  hex: "#C77F4B" },
  { tier: 4, name: "Expert",    minElo: 1500, maxElo: 1999,  color: "42 92% 53%",  hex: "#F5B514" },
  { tier: 5, name: "Elite",     minElo: 2000, maxElo: 2499,  color: "210 17% 88%", hex: "#E5E7EB" },
  { tier: 6, name: "Master",    minElo: 2500, maxElo: 2999,  color: "22 100% 63%", hex: "#FF8C42" },
  {
    tier: 7,
    name: "Apex",
    minElo: 3000,
    maxElo: 999999,
    color: "354 100% 64%",
    hex: "#FF4655",
    gradient:
      "linear-gradient(135deg, #FCD34D 0%, #FF8C42 45%, #FF4655 100%)",
  },
];

/** Map legacy 10-tier names to their closest 7-tier equivalent (by skill band). */
const LEGACY_NAME_MAP: Record<string, RankTier> = {
  iron: "Rookie",
  bronze: "Contender",
  silver: "Rival",
  gold: "Expert",
  platinum: "Elite",
  diamond: "Master",
};

export function getRankByElo(elo: number): RankInfo {
  const safe = Math.max(0, Math.floor(elo || 0));
  return RANKS.find((r) => safe >= r.minElo && safe <= r.maxElo) || RANKS[0];
}

export function getRankByName(name: string): RankInfo {
  const key = (name || "").trim().toLowerCase();
  const mapped = LEGACY_NAME_MAP[key];
  const target = mapped ?? name;
  return (
    RANKS.find((r) => r.name.toLowerCase() === String(target).toLowerCase()) ||
    RANKS[0]
  );
}

export function getEloProgress(elo: number): {
  current: number;
  nextThreshold: number;
  percent: number;
  nextRank: RankInfo | null;
} {
  const rank = getRankByElo(elo);
  const nextRank = RANKS.find((r) => r.tier === rank.tier + 1) || null;
  if (!nextRank) {
    return { current: elo, nextThreshold: rank.maxElo, percent: 100, nextRank: null };
  }
  const rangeSize = nextRank.minElo - rank.minElo;
  const progress = elo - rank.minElo;
  return {
    current: elo,
    nextThreshold: nextRank.minElo,
    percent: Math.min(100, Math.round((progress / rangeSize) * 100)),
    nextRank,
  };
}

/* ------------------------------------------------------------------ */
/* Games                                                               */
/* ------------------------------------------------------------------ */

export type GameId = "valorant" | "cs2" | "r6s";

export interface GameInfo {
  id: GameId;
  name: string;
  shortName: string;
  icon: string;
  iconUrl: string;
  status: "live" | "coming_soon";
}

export const GAMES: GameInfo[] = [
  { id: "valorant", name: "VALORANT",          shortName: "VAL", icon: "🎯", iconUrl: "https://cdn.worldvectorlogo.com/logos/valorant.svg",          status: "live" },
  { id: "cs2",      name: "Counter-Strike 2",  shortName: "CS2", icon: "💥", iconUrl: "https://cdn.worldvectorlogo.com/logos/counter-strike-2.svg",  status: "coming_soon" },
  { id: "r6s",      name: "Rainbow Six Siege", shortName: "R6",  icon: "🛡️", iconUrl: "https://cdn.worldvectorlogo.com/logos/rainbow-six-siege.svg", status: "coming_soon" },
];

export function getGameById(id: GameId): GameInfo {
  return GAMES.find((g) => g.id === id) || GAMES[0];
}

import { enabledGameIds } from "./feature-flags";

export function getActiveGames(): GameInfo[] {
  return GAMES.filter((g) => enabledGameIds.includes(g.id));
}

export function isGameActive(id: GameId): boolean {
  return enabledGameIds.includes(id);
}

/* ------------------------------------------------------------------ */
/* Tournament tiers                                                    */
/* ------------------------------------------------------------------ */

export interface TournamentTier {
  tier: number;
  name: string;
  requirement: string;
  unlockRank?: RankTier;
  unlockPreviousTier?: boolean;
  pointsToUnlock?: number;
}

export const TOURNAMENT_TIERS: TournamentTier[] = [
  { tier: 1, name: "Open Cup",          requirement: "Free entry — anyone can join" },
  { tier: 2, name: "Challenger Series", requirement: "Complete Tier 1 OR reach Rival rank", unlockRank: "Rival",  unlockPreviousTier: true, pointsToUnlock: 80 },
  { tier: 3, name: "Peak Championship", requirement: "Complete Tier 2 OR reach Elite rank", unlockRank: "Elite",  unlockPreviousTier: true, pointsToUnlock: 200 },
];
