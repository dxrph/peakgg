export type TournamentStatus = 'OPEN' | 'LIVE' | 'UPCOMING';
export type TournamentCategory = 'COMMUNITY' | 'OPEN' | 'LEAGUE' | 'SPECIAL';
export type TournamentTab = 'ALL' | 'OPEN' | 'LIVE' | 'UPCOMING' | 'LEAGUES' | 'SPECIAL';
export type Tournament = {id:string;slug:string;code:string;name:string;edition:string;status:TournamentStatus;category:TournamentCategory;region:'EUROPE';format:'5V5'|'1V1';capacity:string;registered?:number;structure:string;date:string;time?:string;registrationLock?:string;visualType:string;image:string;imageAlt:string;imagePosition:string};
export type TournamentFilters = {tab:TournamentTab;region:'ALL'|'EUROPE';format:'ALL'|'5V5'|'1V1';teamSize:'ALL'|'16'|'32'|'64'};
export const defaultTournamentFilters:TournamentFilters={tab:'ALL',region:'ALL',format:'ALL',teamSize:'ALL'};
export const tournaments:Tournament[]=[
  {id:'001',slug:'community-cup-01',code:'001',name:'COMMUNITY CUP',edition:'#01',status:'OPEN',category:'COMMUNITY',region:'EUROPE',format:'5V5',capacity:'16 TEAMS',registered:12,structure:'SINGLE ELIMINATION',date:'29 AUG 2026',time:'19:00 CEST',registrationLock:'28 AUG / 18:00',visualType:'HUMAN COMPETITION',image:'/assets/home/cup-player.png',imageAlt:'Competitive player focused at a tournament setup before a match',imagePosition:'50% 42%'},
  {id:'014',slug:'open-cup-14',code:'014',name:'OPEN CUP',edition:'#14',status:'OPEN',category:'OPEN',region:'EUROPE',format:'5V5',capacity:'32 TEAMS',structure:'SINGLE ELIMINATION',date:'05 SEP 2026',time:'19:00 CEST',visualType:'ARENA ENVIRONMENT',image:'/assets/peakgg-generated/open-cup-v2.png',imageAlt:'Red-lit arena entrance leading toward a competitive stage',imagePosition:'50% 56%'},
  {id:'S01',slug:'peak-league-s01',code:'S01',name:'PEAK LEAGUE',edition:'SEASON 01',status:'UPCOMING',category:'LEAGUE',region:'EUROPE',format:'5V5',capacity:'8 TEAMS',structure:'LEAGUE + PLAYOFFS',date:'12 SEP 2026',visualType:'PREMIUM LEAGUE',image:'/assets/peakgg-generated/peak-league-stage.png',imageAlt:'Peak League trophy on a dark championship stage',imagePosition:'50% 47%'},
  {id:'002',slug:'community-cup-02',code:'002',name:'COMMUNITY CUP',edition:'#02',status:'UPCOMING',category:'COMMUNITY',region:'EUROPE',format:'5V5',capacity:'16 TEAMS',structure:'SINGLE ELIMINATION',date:'19 SEP 2026',visualType:'EVENT STAGE',image:'/assets/peakgg-generated/arena-background.webp',imageAlt:'Empty graphite competition stage with restrained red lighting',imagePosition:'50% 58%'},
  {id:'1V1',slug:'showdown-01',code:'1V1',name:'SHOWDOWN',edition:'#01',status:'UPCOMING',category:'SPECIAL',region:'EUROPE',format:'1V1',capacity:'64 PLAYERS',structure:'SINGLE ELIMINATION',date:'26 SEP 2026',visualType:'DUEL',image:'/assets/peakgg-generated/arena-background.webp',imageAlt:'Two opposing silhouettes separated by a red line',imagePosition:'50% 50%'},
  {id:'SCR',slug:'weekend-scrims-01',code:'SCR',name:'WEEKEND SCRIMS',edition:'#01',status:'UPCOMING',category:'COMMUNITY',region:'EUROPE',format:'5V5',capacity:'16 TEAMS',structure:'SCRIM BLOCK',date:'03 OCT 2026',visualType:'PRACTICE ENVIRONMENT',image:'/assets/peakgg-generated/community-cup-environment.png',imageAlt:'Empty competitive practice room with gaming monitors and red lights',imagePosition:'50% 62%'},
];
export function filterTournaments(items:Tournament[],filters:TournamentFilters){return items.filter(item=>{const tab=filters.tab==='ALL'||filters.tab===item.status||(filters.tab==='LEAGUES'&&item.category==='LEAGUE')||(filters.tab==='SPECIAL'&&item.category==='SPECIAL');const size=item.capacity.split(' ')[0];return tab&&(filters.region==='ALL'||item.region===filters.region)&&(filters.format==='ALL'||item.format===filters.format)&&(filters.teamSize==='ALL'||size===filters.teamSize);});}

const allowedTabs = new Set<TournamentTab>(['ALL','OPEN','LIVE','UPCOMING','LEAGUES','SPECIAL']);
const allowedRegions = new Set<TournamentFilters['region']>(['ALL','EUROPE']);
const allowedFormats = new Set<TournamentFilters['format']>(['ALL','5V5','1V1']);
const allowedSizes = new Set<TournamentFilters['teamSize']>(['ALL','16','32','64']);
const normalized = (value:string|null) => value?.trim().toUpperCase() ?? '';

export function parseTournamentFilters(searchParams:URLSearchParams):TournamentFilters {
  const tab = normalized(searchParams.get('tab') || searchParams.get('status')) as TournamentTab;
  const region = normalized(searchParams.get('region')) as TournamentFilters['region'];
  const format = normalized(searchParams.get('format')) as TournamentFilters['format'];
  const teamSize = normalized(searchParams.get('teamSize')) as TournamentFilters['teamSize'];
  return {
    tab: allowedTabs.has(tab) ? tab : 'ALL',
    region: allowedRegions.has(region) ? region : 'ALL',
    format: allowedFormats.has(format) ? format : 'ALL',
    teamSize: allowedSizes.has(teamSize) ? teamSize : 'ALL',
  };
}

export function serializeTournamentFilters(filters:TournamentFilters):string {
  const query = new URLSearchParams();
  if(filters.tab !== 'ALL') query.set('tab', filters.tab.toLowerCase());
  if(filters.region !== 'ALL') query.set('region', filters.region.toLowerCase());
  if(filters.format !== 'ALL') query.set('format', filters.format.toLowerCase());
  if(filters.teamSize !== 'ALL') query.set('teamSize', filters.teamSize);
  return query.toString();
}

export const getTournamentBySlug = (slug:string) => tournaments.find(tournament => tournament.slug === slug);
export const tournamentHref = (tournament:Pick<Tournament,'slug'>) => `/tournaments/${tournament.slug}`;
