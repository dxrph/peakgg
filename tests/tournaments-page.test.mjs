import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

const read = path => readFileSync(path, 'utf8');

test('the local seed contains exactly the six approved tournaments', async () => {
  const {tournaments} = await import('../data/tournaments.ts');
  assert.deepEqual(tournaments.map(({code, slug, status, category, date}) => ({code, slug, status, category, date})), [
    {code:'001', slug:'community-cup-01', status:'OPEN', category:'COMMUNITY', date:'29 AUG 2026'},
    {code:'014', slug:'open-cup-14', status:'OPEN', category:'OPEN', date:'05 SEP 2026'},
    {code:'S01', slug:'peak-league-s01', status:'UPCOMING', category:'LEAGUE', date:'12 SEP 2026'},
    {code:'002', slug:'community-cup-02', status:'UPCOMING', category:'COMMUNITY', date:'19 SEP 2026'},
    {code:'1V1', slug:'showdown-01', status:'UPCOMING', category:'SPECIAL', date:'26 SEP 2026'},
    {code:'SCR', slug:'weekend-scrims-01', status:'UPCOMING', category:'COMMUNITY', date:'03 OCT 2026'},
  ]);
  assert.equal(tournaments[0].registered, 12);
  assert.equal(tournaments[0].registrationLock, '28 AUG / 18:00');
});

test('filters implement the approved tabs and secondary values', async () => {
  const {tournaments, filterTournaments, defaultTournamentFilters} = await import('../data/tournaments.ts');
  const withFilter = values => filterTournaments(tournaments, {...defaultTournamentFilters, ...values});
  assert.equal(withFilter({tab:'ALL'}).length, 6);
  assert.deepEqual(withFilter({tab:'OPEN'}).map(item => item.code), ['001','014']);
  assert.deepEqual(withFilter({tab:'LIVE'}), []);
  assert.equal(withFilter({tab:'UPCOMING'}).length, 4);
  assert.deepEqual(withFilter({tab:'LEAGUES'}).map(item => item.code), ['S01']);
  assert.deepEqual(withFilter({tab:'SPECIAL'}).map(item => item.code), ['1V1']);
  assert.deepEqual(withFilter({format:'1V1'}).map(item => item.code), ['1V1']);
  assert.deepEqual(withFilter({teamSize:'32'}).map(item => item.code), ['014']);
  assert.equal(withFilter({region:'EUROPE'}).length, 6);
});

test('filter query state round-trips and accepts the legacy footer status parameter', async () => {
  const {parseTournamentFilters, serializeTournamentFilters} = await import('../data/tournaments.ts');
  assert.deepEqual(parseTournamentFilters(new URLSearchParams('status=leagues&format=5v5&teamSize=32')), {
    tab:'LEAGUES', region:'ALL', format:'5V5', teamSize:'32',
  });
  assert.equal(serializeTournamentFilters({tab:'OPEN', region:'EUROPE', format:'ALL', teamSize:'16'}), 'tab=open&region=europe&teamSize=16');
  assert.equal(serializeTournamentFilters({tab:'ALL', region:'ALL', format:'ALL', teamSize:'ALL'}), '');
});

test('local tournament routes resolve every discovery card without a database', async () => {
  const {tournaments, getTournamentBySlug, tournamentHref} = await import('../data/tournaments.ts');
  for (const tournament of tournaments) {
    assert.equal(getTournamentBySlug(tournament.slug)?.id, tournament.id);
    assert.equal(tournamentHref(tournament), `/tournaments/${tournament.slug}`);
  }
  assert.equal(getTournamentBySlug('missing-event'), undefined);
});

test('route composes discovery beneath the global shared shell and exposes detail', () => {
  const source = ['app/tournaments/page.tsx','components/tournaments/TournamentDiscovery.tsx','components/tournaments/FeaturedTournament.tsx'].map(read).join('\n');
  for (const component of ['TournamentFilters','FeaturedTournament','TournamentTimeline','TournamentPoster','CompetitionFlow']) assert.match(source, new RegExp(component));
  assert.match(read('app/layout.tsx'), /SiteHeader/);
  assert.match(read('app/layout.tsx'), /SiteFooter/);
  assert.equal(existsSync('app/tournaments/[slug]/page.tsx'), true);
});

test('locked copy and accessible interaction states are present', () => {
  const files = ['components/tournaments/TournamentsHero.tsx','components/tournaments/FeaturedTournament.tsx','components/tournaments/TournamentDiscovery.tsx','components/tournaments/TournamentFilters.tsx','components/tournaments/CompetitionFlow.tsx','components/tournaments/TournamentsFinalCta.tsx'].map(read).join('\n');
  for (const copy of ['FIND THE NEXT EVENT.','BUILD YOUR RUN.','MAKE THE BRACKET.','REGISTRATION /','NO EVENTS','MATCH THESE FILTERS.','THE CIRCUIT IS OPEN.','BUILT FOR','THE NEXT','MATCH.']) assert.ok(files.includes(copy), copy);
  assert.match(files, /aria-pressed/);
  assert.match(files, /aria-expanded/);
  assert.doesNotMatch(files, /COMING SOON/);
  assert.match(files, /role="dialog"/);
});

test('route stylesheet encodes locked responsive, motion, and focus behavior', () => {
  const css = read('app/tournaments/tournaments.css');
  for (const token of ['#050506','#090A0C','#111216','#191A1F','#F4F2EE','#96979D','#FF2638','#B5091B','#650812']) assert.ok(css.toUpperCase().includes(token), token);
  assert.match(css, /@media\s*\(max-width:\s*1024px\)/);
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /position:\s*sticky/);
});
