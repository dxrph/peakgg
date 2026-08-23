export const PEAK_RANKS = Object.freeze([
  {code: '01', name: 'ROOKIE', mark: 'notch'},
  {code: '02', name: 'CONTENDER', mark: 'split'},
  {code: '03', name: 'RIVAL', mark: 'cross'},
  {code: '04', name: 'EXPERT', mark: 'frame'},
  {code: '05', name: 'ELITE', mark: 'facet'},
  {code: '06', name: 'MASTER', mark: 'spire'},
  {code: '07', name: 'APEX', mark: 'summit'},
]);

export function getRankByCode(code) {
  return PEAK_RANKS.find(rank => rank.code === code) ?? PEAK_RANKS[0];
}

export function filterTeams(teams, filters) {
  const search = filters.search.trim().toLocaleLowerCase();
  return teams.filter(team => {
    const searchable = `${team.name} ${team.tag}`.toLocaleLowerCase();
    return (!search || searchable.includes(search))
      && (filters.region === 'ALL' || team.region === filters.region)
      && (filters.status === 'ALL' || team.recruiting);
  });
}
