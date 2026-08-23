import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PEAK_RANKS,
  filterTeams,
  getRankByCode,
} from '../lib/internal-pages-models.mjs';

const teams = [
  {name: 'Nova', tag: 'NVA', region: 'EUROPE', recruiting: true},
  {name: 'Rift', tag: 'RFT', region: 'EU WEST', recruiting: false},
  {name: 'North', tag: 'NTH', region: 'EU NORTH/EAST', recruiting: true},
];

test('team directory filters search, region, and recruiting state together', () => {
  assert.deepEqual(
    filterTeams(teams, {search: 'no', region: 'EUROPE', status: 'RECRUITING'}).map(team => team.tag),
    ['NVA'],
  );
  assert.deepEqual(
    filterTeams(teams, {search: '', region: 'ALL', status: 'RECRUITING'}).map(team => team.tag),
    ['NVA', 'NTH'],
  );
});

test('rank system exposes seven ordered, visually distinct PeakGG tiers', () => {
  assert.deepEqual(PEAK_RANKS.map(rank => rank.name), [
    'ROOKIE', 'CONTENDER', 'RIVAL', 'EXPERT', 'ELITE', 'MASTER', 'APEX',
  ]);
  assert.equal(new Set(PEAK_RANKS.map(rank => rank.mark)).size, 7);
  assert.equal(getRankByCode('07').name, 'APEX');
  assert.equal(getRankByCode('invalid').name, 'ROOKIE');
});
