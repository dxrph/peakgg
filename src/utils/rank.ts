// Rank utilities — single source of truth for rank derivation from ELO.
// Always derive rank from the live ELO value, never from a stale DB string.

import { getRankByElo, getRankByName, RANKS, type RankTier } from "@/lib/ranks";

export type { RankTier };

export function getRankFromElo(elo: number): RankTier {
  return getRankByElo(elo).name;
}

export function getRankColor(rank: string): string {
  return getRankByName(rank).hex;
}

/** CSS gradient string. For non-Apex tiers returns a subtle same-color gradient. */
export function getRankGradient(rank: string): string {
  const info = getRankByName(rank);
  if (info.gradient) return info.gradient;
  return `linear-gradient(135deg, ${info.hex} 0%, ${info.hex} 100%)`;
}

export { RANKS };