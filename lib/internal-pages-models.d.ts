export type PeakRank = {code: string; slug: string; name: string; mark: string; elo: string; accent: string; glow: string};
export const PEAK_RANKS: readonly PeakRank[];
export function getRankByCode(code: string): PeakRank;
export function getRankBySlug(slug: string | undefined | null): PeakRank;
export function filterTeams<T extends {name:string;tag:string;region:string;recruiting:boolean}>(teams: T[], filters: {search:string;region:string;status:string}): T[];

export type DirectoryPlayer = {
  id: string; username: string; region: string; role: string; rank: string; rankCode: string; rankSlug: string;
  elo: number; lookingForTeam: boolean; team: string | null;
};
export type PlayerFilters = {search: string; region: string; role: string; status: string};

export const PLAYER_REGIONS: readonly string[];
export const PLAYER_ROLES: readonly string[];
export const PLAYER_STATUSES: readonly string[];
export const DEMO_PLAYERS: readonly DirectoryPlayer[];
export const EMPTY_PLAYER_FILTERS: PlayerFilters;
export function normalizePlayerFilters(input?: Partial<Record<keyof PlayerFilters, string | undefined>>): PlayerFilters;
export function filterPlayers<T extends DirectoryPlayer>(players: readonly T[], filters: PlayerFilters): T[];
export function playerFiltersToQuery(filters: PlayerFilters): string;
export function hasActivePlayerFilters(filters: PlayerFilters): boolean;

export const TEAM_LOGO_TYPES: readonly string[];
export const TEAM_LOGO_MAX_BYTES: number;
export function normalizeTeamTag(value: string): string;
export function validateTeamLogo(file: {type: string; size: number} | null | undefined): {ok: boolean; error: string | null};
export const TEAM_STEP_FIELDS: readonly (readonly string[])[];
export function validateTeamStep(
  step: number,
  values: {name: string; tag: string; region: string; description?: string; logoError?: string | null},
  teamValidator: (team: {name: string; tag: string; region: string}) => {ok: boolean; errors: Record<string, string>},
): {ok: boolean; errors: Record<string, string>};
