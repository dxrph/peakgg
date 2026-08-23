export type PeakRank = {code: string; name: string; mark: string};
export const PEAK_RANKS: readonly PeakRank[];
export function getRankByCode(code: string): PeakRank;
export function filterTeams<T extends {name:string;tag:string;region:string;recruiting:boolean}>(teams: T[], filters: {search:string;region:string;status:string}): T[];
