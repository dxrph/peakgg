/**
 * Single source of demo data for PeakGG.
 * Components must never hardcode data: they read from here.
 * Internally multi-game ready; the currently visible product is Valorant only.
 */

export type GameSlug = "valorant";

export interface Game {
  slug: GameSlug;
  name: string;
  teamSize: number;
  roles: string[];
  ranks: string[];
  maps: string[];
}

export interface PlayerGameProfile {
  game: GameSlug;
  rank: string;
  roles: string[];
}

export interface Player {
  id: string;
  handle: string;
  tag: string;
  region: string;
  languages: string[];
  availability: string[];
  games: PlayerGameProfile[];
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  game: GameSlug;
  memberIds: string[];
}

export type TournamentStatus = "announced" | "open" | "live" | "finished";

export interface Tournament {
  id: string;
  game: GameSlug;
  titleKey: string;
  number: number;
  date: string;
  time: string;
  timezone: string;
  region: string;
  format: string;
  slots: number;
  status: TournamentStatus;
}

export type MatchStatus = "scheduled" | "live" | "finished";

export interface Match {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  map: string;
  round: string;
  status: MatchStatus;
}

export const valorant: Game = {
  slug: "valorant",
  name: "VALORANT",
  teamSize: 5,
  roles: ["Duelist", "Initiator", "Controller", "Sentinel", "Flex"],
  ranks: ["Rookie", "Contender", "Rival", "Expert", "Elite", "Master", "Apex"],
  maps: [],
};

export const games: Game[] = [valorant];

export const playersOnline = 1284;

export const featuredTournament: Tournament = {
  id: "open-cup-004",
  game: "valorant",
  titleKey: "hero.tournament.title",
  number: 4,
  date: "2026-09-16",
  time: "20:00",
  timezone: "CEST",
  region: "Europe",
  format: "5v5",
  slots: 16,
  status: "open",
};

export const players: Player[] = [];
export const teams: Team[] = [];
export const tournaments: Tournament[] = [featuredTournament];
export const matches: Match[] = [];
