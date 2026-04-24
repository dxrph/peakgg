// PeakGG Rank System — platform-wide, game-agnostic
// 8-tier system: Rookie → Bronze → Silver → Gold → Platinum → Diamond → Master → Apex

export type RankTier =
  | "Rookie"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Apex";

export interface RankInfo {
  tier: number;
  name: RankTier;
  minElo: number;
  maxElo: number;
  color: string; // HSL for CSS vars
  hex: string;   // Primary brand color
  gradient?: string; // Optional CSS gradient (used by Apex)
}

export const RANKS: RankInfo[] = [
  { tier: 1, name: "Rookie",   minElo: 0,    maxElo: 999,  color: "220 9% 60%",  hex: "#9CA3AF" },
  { tier: 2, name: "Bronze",   minElo: 1000, maxElo: 1199, color: "27 86% 27%",  hex: "#92400E" },
  { tier: 3, name: "Silver",   minElo: 1200, maxElo: 1399, color: "220 9% 65%",  hex: "#C0C5CE" },
  { tier: 4, name: "Gold",     minElo: 1400, maxElo: 1649, color: "38 92% 50%",  hex: "#F59E0B" },
  { tier: 5, name: "Platinum", minElo: 1650, maxElo: 1899, color: "189 94% 43%", hex: "#06B6D4" },
  { tier: 6, name: "Diamond",  minElo: 1900, maxElo: 2099, color: "217 91% 60%", hex: "#3B82F6" },
  { tier: 7, name: "Master",   minElo: 2100, maxElo: 2399, color: "258 90% 66%", hex: "#8B5CF6" },
  { tier: 8, name: "Apex",     minElo: 2400, maxElo: 99999, color: "12 90% 55%", hex: "#EF4444",
    gradient: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)" },
];

export function getRankByElo(elo: number): RankInfo {
  const safe = Math.max(0, Math.floor(elo || 0));
  return RANKS.find(r => safe >= r.minElo && safe <= r.maxElo) || RANKS[0];
}

export function getRankByName(name: string): RankInfo {
  return RANKS.find(r => r.name.toLowerCase() === (name || "").toLowerCase()) || RANKS[0];
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
  { tier: 2, name: "Challenger Series", requirement: "Complete Tier 1 OR reach Silver rank", unlockRank: "Silver", unlockPreviousTier: true, pointsToUnlock: 80 },
  { tier: 3, name: "Peak Championship", requirement: "Complete Tier 2 OR reach Diamond rank", unlockRank: "Diamond", unlockPreviousTier: true, pointsToUnlock: 200 },
];
