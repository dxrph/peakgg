import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('homepage uses the locked PeakGG red, black, and white palette', () => {
  const css = read('app/globals.css').toLowerCase();
  assert.match(css, /--red:\s*#ff2638/);
  assert.doesNotMatch(css, /#c8ff00|--violet|#a478ff/);
});

test('major visual sections use distinct purpose-built campaign assets', () => {
  const assignments = [
    ['components/home/Hero.tsx', '/assets/agents/jett.png', 'public/assets/agents/jett.png'],
    ['components/home/NextTournament.tsx', '/assets/peakgg-generated/community-cup.webp', 'public/assets/peakgg-generated/community-cup.webp'],
    ['components/home/Community.tsx', '/assets/peakgg-generated/community-scene.webp', 'public/assets/peakgg-generated/community-scene.webp'],
  ];

  for (const [component, source, asset] of assignments) {
    assert.match(read(component), new RegExp(source.replaceAll('/', '\\/').replace('.', '\\.')));
    assert.ok(existsSync(asset), `${asset} must exist locally`);
  }
});

test('rank presentation stays graphic instead of reusing hero photography', () => {
  const rank = read('components/home/RankJourney.tsx');
  assert.doesNotMatch(rank, /hero-main|hero-team|<Image/);
  assert.match(rank, /rank-grid/);
});

test('design documentation records the locked campaign direction', () => {
  const master = read('design-system/peakgg/MASTER.md');
  assert.match(master, /COMPETITIVE × EDITORIAL × CINEMATIC/);
  assert.match(master, /#FF2638/i);
  assert.doesNotMatch(master, /Neon purple|#7C3AED|#A78BFA|#F43F5E/);
});

test('role dossier uses five distinct official agent portraits and accessible state controls', () => {
  const role = read('components/home/Squad.tsx');
  for (const agent of ['jett', 'omen', 'fade', 'killjoy', 'yoru']) {
    assert.match(role, new RegExp(`/assets/agents/${agent}\\.png`));
    assert.ok(existsSync(`public/assets/agents/${agent}.png`), `${agent} portrait must exist locally`);
  }
  assert.match(role, /aria-selected/);
  assert.match(role, /role="tablist"/);
});

test('homepage includes team finder and match room product previews', () => {
  const page = read('app/page.tsx');
  assert.match(page, /TeamFinder/);
  assert.match(page, /MatchRoom/);
  assert.ok(existsSync('components/home/TeamFinder.tsx'));
  assert.ok(existsSync('components/home/MatchRoom.tsx'));
});

test('homepage exposes semantic navigation and a single primary heading', () => {
  const page = read('app/page.tsx');
  const hero = read('components/home/Hero.tsx');
  const header = read('components/shared/SiteHeader.tsx');
  assert.match(page, /skip-link/);
  assert.match(page, /id="main-content"/);
  assert.equal((hero.match(/<h1/g) || []).length, 1);
  assert.match(header, /aria-current/);
});

test('role dossier has explicit previous and next controls', () => {
  const role = read('components/home/Squad.tsx');
  assert.match(role, /Previous role/);
  assert.match(role, /Next role/);
  assert.match(role, /onKeyDown/);
});

test('homepage tournament circuit reads published database events without fake cards', () => {
  const event = read('components/home/TournamentWorld.tsx');
  assert.match(event, /from\('tournaments'\)/);
  assert.match(event, /NO EVENTS/);
  assert.doesNotMatch(event, /DEMO/);
});

test('hero agent hover is reachable through decorative layers', () => {
  const hero = read('components/home/Hero.tsx');
  const css = read('app/globals.css');
  assert.match(hero, /hero-phoenix/);
  assert.match(css, /\.hero-wash\{[^}]*pointer-events:none/);
  assert.match(css, /\.hero-type\{[^}]*pointer-events:none/);
  assert.match(css, /\.hero-agent:hover \.hero-phoenix/);
  assert.match(css, /mask-image:radial-gradient\(circle at var\(--reveal-x\) var\(--reveal-y\)/);
  assert.doesNotMatch(css, /hero-new:has\(\.hero-agent:hover\) \.hero-type/);
  assert.match(hero, /onPointerEnter=\{moveReveal\}/);
  assert.match(hero, /onPointerMove=\{moveReveal\}/);
});
