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

export interface SignalItem { labelKey: string; valueKey: string }
export interface RosterSlot { id: string; role: string; rank: string; region: string; language: string }
export interface UpcomingTournament { id: string; date: string; nameKey: string; statusKey: string }

export const valorant: Game = {
  slug: "valorant",
  name: "VALORANT",
  teamSize: 5,
  roles: ["Duelist", "Initiator", "Controller", "Sentinel", "Flex"],
  ranks: ["Rookie", "Contender", "Rival", "Expert", "Elite", "Master", "Apex"],
  maps: [],
};

export const games: Game[] = [valorant];

export const featuredTournament: Tournament = {
  id: "open-cup-004",
  game: "valorant",
  titleKey: "hero.tournament.title",
  number: 4,
  date: "2026-09-24",
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

export const liveSignals: SignalItem[] = [
  { labelKey: "signal.beta", valueKey: "signal.eu" },
  { labelKey: "signal.firstCup", valueKey: "signal.registrationSoon" },
  { labelKey: "signal.teamFinder", valueKey: "signal.open" },
  { labelKey: "signal.playerProfiles", valueKey: "signal.open" },
];

export const rankNames = valorant.ranks;

export const rosterSlots: RosterSlot[] = [
  { id: "duelist", role: "Duelist", rank: "Elite", region: "EU West", language: "EN" },
  { id: "initiator", role: "Initiator", rank: "Expert", region: "EU West", language: "EN / IT" },
  { id: "controller", role: "Controller", rank: "Rival", region: "EU Central", language: "EN" },
  { id: "sentinel", role: "Sentinel", rank: "Elite", region: "EU Central", language: "EN / IT" },
  { id: "flex", role: "Flex", rank: "Contender", region: "EU West", language: "EN" },
];

export const upcomingTournaments: UpcomingTournament[] = [
  { id: "solo-night", date: "2026-09-21", nameKey: "upcoming.events.solo", statusKey: "upcoming.status.registration" },
  { id: "community-05", date: "2026-09-24", nameKey: "upcoming.events.community", statusKey: "upcoming.status.open" },
  { id: "peak-series", date: "2026-10-02", nameKey: "upcoming.events.series", statusKey: "upcoming.status.soon" },
  { id: "open-005", date: "2026-10-10", nameKey: "upcoming.events.openCup", statusKey: "upcoming.status.soon" },
];
