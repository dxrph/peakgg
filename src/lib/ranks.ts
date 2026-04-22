// PeakGG Rank System — platform-wide, game-agnostic

export type RankTier = "Rookie" | "Contender" | "Rival" | "Expert" | "Elite" | "Master" | "Apex";

export interface RankInfo {
  tier: number;
  name: RankTier;
  minElo: number;
  maxElo: number;
  color: string; // HSL for CSS vars
  hex: string;   // For direct use
}

export const RANKS: RankInfo[] = [
  { tier: 1, name: "Rookie",     minElo: 0,    maxElo: 499,  color: "0 0% 62%",       hex: "#9e9e9e" },
  { tier: 2, name: "Contender",  minElo: 500,  maxElo: 999,  color: "122 39% 49%",    hex: "#4caf50" },
  { tier: 3, name: "Rival",      minElo: 1000, maxElo: 1499, color: "187 100% 37%",   hex: "#00bcd4" },
  { tier: 4, name: "Expert",     minElo: 1500, maxElo: 1999, color: "210 79% 46%",    hex: "#2196f3" },
  { tier: 5, name: "Elite",      minElo: 2000, maxElo: 2499, color: "291 64% 42%",    hex: "#9c27b0" },
  { tier: 6, name: "Master",     minElo: 2500, maxElo: 2999, color: "36 100% 50%",    hex: "#ff9800" },
  { tier: 7, name: "Apex",       minElo: 3000, maxElo: 9999, color: "352 100% 62%",   hex: "#ff4655" },
];

export function getRankByElo(elo: number): RankInfo {
  return RANKS.find(r => elo >= r.minElo && elo <= r.maxElo) || RANKS[0];
}

export function getEloProgress(elo: number): { current: number; nextThreshold: number; percent: number; nextRank: RankInfo | null } {
  const rank = getRankByElo(elo);
  const nextRank = RANKS.find(r => r.tier === rank.tier + 1) || null;
  if (!nextRank) return { current: elo, nextThreshold: rank.maxElo, percent: 100, nextRank: null };
  const rangeSize = nextRank.minElo - rank.minElo;
  const progress = elo - rank.minElo;
  return { current: elo, nextThreshold: nextRank.minElo, percent: Math.min(100, Math.round((progress / rangeSize) * 100)), nextRank };
}

export type GameId = "valorant" | "cs2" | "r6";

export interface GameInfo {
  id: GameId;
  name: string;
  shortName: string;
  icon: string; // legacy emoji (kept for chat channel labels, etc.)
  iconUrl: string; // official logo URL — use via <GameIcon /> component
}

export const GAMES: GameInfo[] = [
  {
    id: "valorant",
    name: "VALORANT",
    shortName: "VAL",
    icon: "🎯",
    iconUrl: "https://cdn.worldvectorlogo.com/logos/valorant.svg",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    shortName: "CS2",
    icon: "💥",
    iconUrl: "https://cdn.worldvectorlogo.com/logos/counter-strike-2.svg",
  },
  {
    id: "r6",
    name: "Rainbow Six Siege",
    shortName: "R6",
    icon: "🛡️",
    iconUrl: "https://cdn.worldvectorlogo.com/logos/rainbow-six-siege.svg",
  },
];

export function getGameById(id: GameId): GameInfo {
  return GAMES.find(g => g.id === id) || GAMES[0];
}

// Tournament tier system
export interface TournamentTier {
  tier: number;
  name: string;
  requirement: string;
  unlockRank?: RankTier;
  unlockPreviousTier?: boolean;
  pointsToUnlock?: number;
}

export const TOURNAMENT_TIERS: TournamentTier[] = [
  { tier: 1, name: "Open Cup", requirement: "Free entry — anyone can join" },
  { tier: 2, name: "Challenger Series", requirement: "Complete Tier 1 OR reach Contender rank", unlockRank: "Contender", unlockPreviousTier: true, pointsToUnlock: 80 },
  { tier: 3, name: "Peak Championship", requirement: "Complete Tier 2 OR reach Elite rank", unlockRank: "Elite", unlockPreviousTier: true, pointsToUnlock: 200 },
];
