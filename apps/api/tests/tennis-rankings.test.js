import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseEspnRankings, parseWtaRankings, validateRankings } from '../src/utils/tennisRankings.js';
import { syncPlayerData } from '../src/utils/playerDataSync.js';

const espn = JSON.parse(fs.readFileSync(new URL('./fixtures/espn-atp-rankings.json', import.meta.url)));
const wtaHtml = fs.readFileSync(new URL('./fixtures/wta-rankings.html', import.meta.url), 'utf8');

test('ESPN public JSON supplies ATP profile fields and feed date', () => {
  const players = parseEspnRankings(espn);
  assert.equal(players.length, 50);
  assert.deepEqual([players[0].name, players[0].ranking, players[0].points, players[0].age], ['Jannik Sinner', 1, 11000, 25]);
  assert.equal(players[0].source, 'atp');
  assert.equal(players[0].ranking_date, '2026-09-24T07:00Z');
  assert.match(players[0].imageUrl, /\.png$/);
  assert.match(players[0].profile_url, /\/player\//);
});

test('WTA comma-separated points retain all digits; rank excludes movement', () => {
  const players = parseWtaRankings(wtaHtml);
  assert.equal(players.length, 50);
  assert.deepEqual([players[0].name, players[0].ranking, players[0].points, players[0].age], ['Elena Rybakina', 1, 9901, 27]);
  assert.equal(players[20].ranking, 21);
  assert.equal(players[0].ranking_date, '2026-09-28');
  assert.equal(players[0].source, 'wta');
});

test('challenge pages, partial feeds and duplicate ranks cannot become snapshots', () => {
  assert.throws(() => parseWtaRankings('<html>Access denied</html>'), /Incomplete/);
  assert.throws(() => parseEspnRankings({}), /Missing/);
  const players = parseEspnRankings(espn);
  assert.throws(() => validateRankings(players.slice(0, 49)), /Incomplete/);
  assert.throws(() => validateRankings([...players.slice(0, 49), players[0]]), /Duplicate/);
});

function fakeClient(records, failName) {
  const updates = [];
  const created = [];
  const collection = {
    getFullList: async () => records,
    update: async (id, data) => {
      if (failName && data.name === failName) throw new Error('Database unavailable');
      updates.push({ id, ...data });
      return { id };
    },
    create: async data => { created.push(data); return { id: `created-${created.length}` }; },
  };
  return { client: { collection: () => collection }, updates, created };
}

test('sync normalizes sources, preserves matching IDs and un-ranks absent players', async () => {
  const players = parseEspnRankings(espn);
  const fake = fakeClient([
    { id: 'favorite-player', name: players[0].name, source: 'ATP', bio: 'Editorial biography' },
    { id: 'retired-player', name: 'Retired Player', source: 'atp', ranking: 2 },
    { id: 'female-player', name: 'Female Player', source: 'wta', ranking: 1 },
  ]);
  const result = await syncPlayerData(players, 'atp', fake.client);
  assert.equal(result.updated, 1);
  assert.equal(result.created, 49);
  assert.equal(result.unranked, 1);
  assert.equal(fake.updates[0].id, 'favorite-player');
  assert.equal(fake.updates[0].source, 'atp');
  assert.equal(fake.updates[0].bio, undefined); // PATCH preserves editorial fields.
  assert.equal(fake.updates.find(row => row.id === 'retired-player').ranking, null);
  assert.ok(!fake.updates.some(row => row.id === 'female-player'));
});

test('a failed database write never retires the previous players or reports success', async () => {
  const players = parseEspnRankings(espn);
  const fake = fakeClient([
    { id: 'first', name: players[0].name, source: 'atp' },
    { id: 'second', name: players[1].name, source: 'atp' },
    { id: 'old', name: 'Old Player', source: 'atp' },
  ], players[1].name);
  await assert.rejects(syncPlayerData(players, 'atp', fake.client), /Database unavailable/);
  assert.ok(!fake.updates.some(row => row.id === 'old'));
});
