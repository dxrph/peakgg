// PeakGG Rank System — platform-wide, game-agnostic
// 8-tier system: Rookie → Bronze → Silver → Gold → Platinum → Diamond → Master → Apex

export type RankTier =
  | "Rookie"
  | "Iron"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Elite"
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
  { tier: 1,  name: "Rookie",   minElo: 0,    maxElo: 599,  color: "220 9% 70%",  hex: "#BFC3CC" },
  { tier: 2,  name: "Iron",     minElo: 600,  maxElo: 999,  color: "220 6% 45%",  hex: "#6B7280" },
  { tier: 3,  name: "Bronze",   minElo: 1000, maxElo: 1199, color: "27 70% 45%",  hex: "#B45309" },
  { tier: 4,  name: "Silver",   minElo: 1200, maxElo: 1399, color: "220 14% 78%", hex: "#CBD5E1" },
  { tier: 5,  name: "Gold",     minElo: 1400, maxElo: 1599, color: "42 95% 55%",  hex: "#F5B514" },
  { tier: 6,  name: "Platinum", minElo: 1600, maxElo: 1799, color: "180 70% 55%", hex: "#3FD3D5" },
  { tier: 7,  name: "Diamond",  minElo: 1800, maxElo: 1999, color: "217 91% 62%", hex: "#4F8DF9" },
  { tier: 8,  name: "Elite",    minElo: 2000, maxElo: 2199, color: "271 81% 60%", hex: "#A855F7" },
  { tier: 9,  name: "Master",   minElo: 2200, maxElo: 2399, color: "330 84% 58%", hex: "#EC4899" },
  { tier: 10, name: "Apex",     minElo: 2400, maxElo: 99999, color: "12 90% 55%", hex: "#EF4444",
    gradient: "linear-gradient(135deg, #FCD34D 0%, #F97316 50%, #EF4444 100%)" },
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

export type GameId = "valorant" | "cs2" | "r6s";

export interface GameInfo {
  id: GameId;
  name: string;
  shortName: string;
  icon: string; // legacy emoji (kept for chat channel labels, etc.)
  iconUrl: string; // official logo URL — use via <GameIcon /> component
  status: "live" | "coming_soon";
}

export const GAMES: GameInfo[] = [
  {
    id: "valorant",
    name: "VALORANT",
    shortName: "VAL",
    icon: "🎯",
    iconUrl: "https://cdn.worldvectorlogo.com/logos/valorant.svg",
    status: "live",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    shortName: "CS2",
    icon: "💥",
    iconUrl: "https://cdn.worldvectorlogo.com/logos/counter-strike-2.svg",
    status: "coming_soon",
  },
  {
    id: "r6s",
    name: "Rainbow Six Siege",
    shortName: "R6",
    icon: "🛡️",
    iconUrl: "https://cdn.worldvectorlogo.com/logos/rainbow-six-siege.svg",
    status: "coming_soon",
  },
];

export function getGameById(id: GameId): GameInfo {
  return GAMES.find(g => g.id === id) || GAMES[0];
}

// Active games respect the `valorantOnlyBeta` feature flag so the rest of the
// UI (game switcher, filters, marketing) can stay multi-game-aware while the
// closed beta hides everything except Valorant. Reactivating CS2 / R6S is a
// one-flag flip — no code deletion required.
import { enabledGameIds } from "./feature-flags";

export function getActiveGames(): GameInfo[] {
  return GAMES.filter(g => enabledGameIds.includes(g.id));
}

export function isGameActive(id: GameId): boolean {
  return enabledGameIds.includes(id);
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
