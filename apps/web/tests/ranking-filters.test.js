import test from 'node:test';
import assert from 'node:assert/strict';
import { readRankingFilters, filterRankingRows } from '../src/lib/rankingFilters.js';

const rows = [
  { name: 'Alexander Zverev', country: 'DE', position: 2, points: 9630 },
  { name: 'Tomáš Macháč', country: 'CZ', position: 35, points: 1350 },
  { name: 'Jannik Sinner', country: 'IT', position: 1, points: 11000 },
  { name: 'Federico Cina', country: 'IT', position: 150, points: 369 },
];
const defaults = readRankingFilters(new URLSearchParams());

test('default tour is ATP; invalid URL filters use safe defaults', () => {
  assert.equal(defaults.source, 'atp');
  assert.equal(defaults.limit, 50);
  const invalid = readRankingFilters(new URLSearchParams('tour=all&size=0&page=-9&sort=unknown&top=-1'));
  assert.deepEqual(invalid, defaults);
});
test('shared URLs restore tour, country, range, page size and page', () => {
  assert.deepEqual(readRankingFilters(new URLSearchParams('tour=wta&q=Japan&country=JP&top=100&size=25&page=2&sort=points')),
    { ...defaults, source: 'wta', search: 'Japan', country: 'JP', range: '100', limit: 25, page: 2, sortBy: 'points' });
});
test('trimmed searches ignore accents and support localized country names', () => {
  assert.equal(filterRankingRows(rows, { ...defaults, search: '  Tomas Machac  ' })[0].position, 35);
  assert.equal(filterRankingRows(rows, { ...defaults, search: '德国' }, code => code === 'DE' ? '德国' : code)[0].position, 2);
});
test('country and top rank filters compose before sorting without mutating source', () => {
  const result = filterRankingRows(rows, { ...defaults, country: 'IT', range: '100', sortBy: 'points' });
  assert.deepEqual(result.map(row => row.position), [1]);
  assert.deepEqual(filterRankingRows(rows, defaults).map(row => row.position), [1, 2, 35, 150]);
  assert.equal(rows[0].position, 2);
  assert.deepEqual(filterRankingRows(rows, { ...defaults, search: 'no such player' }), []);
});
