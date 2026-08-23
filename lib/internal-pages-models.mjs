export const PEAK_RANKS = Object.freeze([
  {code: '01', slug: 'rookie', name: 'ROOKIE', mark: 'notch', elo: '0 – 499', accent: '#7C7F87', glow: 'rgba(124,127,135,.35)'},
  {code: '02', slug: 'contender', name: 'CONTENDER', mark: 'split', elo: '500 – 999', accent: '#4FB477', glow: 'rgba(79,180,119,.32)'},
  {code: '03', slug: 'rival', name: 'RIVAL', mark: 'cross', elo: '1000 – 1499', accent: '#3FB6AE', glow: 'rgba(63,182,174,.32)'},
  {code: '04', slug: 'expert', name: 'EXPERT', mark: 'frame', elo: '1500 – 1999', accent: '#4C8DF6', glow: 'rgba(76,141,246,.32)'},
  {code: '05', slug: 'elite', name: 'ELITE', mark: 'facet', elo: '2000 – 2499', accent: '#9B6BF2', glow: 'rgba(155,107,242,.32)'},
  {code: '06', slug: 'master', name: 'MASTER', mark: 'spire', elo: '2500 – 2999', accent: '#FF8C00', glow: 'rgba(255,140,0,.34)'},
  {code: '07', slug: 'apex', name: 'APEX', mark: 'summit', elo: '3000 +', accent: '#FF2638', glow: 'rgba(255,38,56,.4)'},
]);

export function getRankByCode(code) {
  return PEAK_RANKS.find(rank => rank.code === code) ?? PEAK_RANKS[0];
}

export function getRankBySlug(slug) {
  const value = String(slug ?? '').trim().toLocaleLowerCase();
  return PEAK_RANKS.find(rank => rank.slug === value) ?? PEAK_RANKS[0];
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

/* Player directory ------------------------------------------------------- */

export const PLAYER_REGIONS = Object.freeze(['ALL', 'EU WEST', 'EU NORTH/EAST', 'EU OTHER']);
export const PLAYER_ROLES = Object.freeze(['ALL', 'DUELIST', 'CONTROLLER', 'INITIATOR', 'SENTINEL', 'FLEX']);
export const PLAYER_STATUSES = Object.freeze(['ALL', 'LOOKING FOR TEAM', 'IN TEAM']);

const HANDLES = ['NOVA', 'RIFT', 'ECHO', 'VAULT', 'ARC', 'CIPHER', 'HOLLOW', 'PRISM', 'DRIFT', 'ONYX', 'RAVEN', 'SPIRE', 'GLASS', 'KITE', 'MIRA', 'VOLT', 'STORM', 'ASH', 'HAZE', 'CREST', 'TALON', 'LUME', 'NORTH', 'FLUX', 'SABLE', 'QUARTZ', 'ORBIT', 'FROST', 'EMBER', 'SLATE', 'PULSE', 'ZENITH', 'CARBON', 'AURORA', 'FABLE', 'IRON'];
const TEAM_NAMES = ['NORTHWIND', 'RIDGELINE', 'BASECAMP', 'SUMMIT SIX', 'COLD FRONT', 'ALPINE', 'TRUE NORTH', 'SERAC'];

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPlayers() {
  const random = seeded(0x50454b47);
  const regions = PLAYER_REGIONS.slice(1);
  const roles = PLAYER_ROLES.slice(1);
  return HANDLES.map((handle, index) => {
    const pick = list => list[Math.floor(random() * list.length)];
    const region = pick(regions);
    const role = pick(roles);
    const rank = PEAK_RANKS[Math.floor(random() * PEAK_RANKS.length)];
    const lookingForTeam = random() < 0.45;
    return Object.freeze({
      id: `player-${index + 1}`,
      username: `${handle}${String(index + 1).padStart(2, '0')}`,
      region,
      role,
      rank: rank.name,
      rankCode: rank.code,
      rankSlug: rank.slug,
      elo: 120 + Math.floor(random() * 2900),
      lookingForTeam,
      team: lookingForTeam ? null : pick(TEAM_NAMES),
    });
  });
}

export const DEMO_PLAYERS = Object.freeze(buildPlayers());

export const EMPTY_PLAYER_FILTERS = Object.freeze({search: '', region: 'ALL', role: 'ALL', status: 'ALL'});

export function normalizePlayerFilters(input = {}) {
  const upper = value => String(value ?? '').trim().toLocaleUpperCase();
  const one = (value, allowed) => (allowed.includes(upper(value)) ? upper(value) : 'ALL');
  return {
    search: String(input.search ?? '').slice(0, 40),
    region: one(input.region, PLAYER_REGIONS),
    role: one(input.role, PLAYER_ROLES),
    status: one(input.status, PLAYER_STATUSES),
  };
}

export function filterPlayers(players, filters) {
  const search = filters.search.trim().toLocaleLowerCase();
  return players.filter(player => {
    const searchable = `${player.username} ${player.team ?? ''} ${player.role} ${player.rank}`.toLocaleLowerCase();
    const statusMatch = filters.status === 'ALL'
      || (filters.status === 'LOOKING FOR TEAM' ? player.lookingForTeam : !player.lookingForTeam);
    return (!search || searchable.includes(search))
      && (filters.region === 'ALL' || player.region === filters.region)
      && (filters.role === 'ALL' || player.role === filters.role)
      && statusMatch;
  });
}

export function playerFiltersToQuery(filters) {
  const query = new URLSearchParams();
  if (filters.search.trim()) query.set('search', filters.search.trim());
  if (filters.region !== 'ALL') query.set('region', filters.region);
  if (filters.role !== 'ALL') query.set('role', filters.role);
  if (filters.status !== 'ALL') query.set('status', filters.status);
  return query.toString();
}

export function hasActivePlayerFilters(filters) {
  return Boolean(filters.search.trim()) || filters.region !== 'ALL' || filters.role !== 'ALL' || filters.status !== 'ALL';
}

/* Team creation wizard --------------------------------------------------- */

export const TEAM_LOGO_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/webp']);
export const TEAM_LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function normalizeTeamTag(value) {
  return String(value ?? '').toLocaleUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function validateTeamLogo(file) {
  if (!file || !file.size) return {ok: true, error: null};
  if (!TEAM_LOGO_TYPES.includes(file.type)) return {ok: false, error: 'LOGO MUST BE PNG, JPEG OR WEBP.'};
  if (file.size > TEAM_LOGO_MAX_BYTES) return {ok: false, error: 'LOGO MUST BE SMALLER THAN 2 MB.'};
  return {ok: true, error: null};
}

export const TEAM_STEP_FIELDS = Object.freeze([['name', 'tag', 'region'], ['description', 'logo'], []]);

export function validateTeamStep(step, values, teamValidator) {
  const result = teamValidator({name: values.name, tag: values.tag, region: values.region});
  const errors = {};
  for (const field of TEAM_STEP_FIELDS[step] ?? []) if (result.errors[field]) errors[field] = result.errors[field];
  if (step === 1 && values.logoError) errors.logo = values.logoError;
  return {ok: Object.keys(errors).length === 0, errors};
}
