import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseWtaRankings, validateRankings } from '../src/utils/tennisRankings.js';
import { parseAtpRankings } from '../src/utils/atpRankings.js';
import { syncPlayerData } from '../src/utils/playerDataSync.js';

const atp = fs.readFileSync(new URL('./fixtures/atp-official-rankings.pdf', import.meta.url));
const parse = () => parseAtpRankings(atp, Date.parse('2026-10-03'));
const wtaHtml = fs.readFileSync(new URL('./fixtures/wta-rankings.html', import.meta.url), 'utf8');

test('official ATP PDF supplies ranks, points, tournaments and UTC feed date', async () => {
  const players = validateRankings(await parse());
  assert.equal(players.length, 150);
  assert.deepEqual([players[0].name, players[0].ranking, players[0].points, players[0].country], ['Jannik Sinner', 1, 11000, 'IT']);
  assert.equal(players[0].ranking_date, '2026-09-28');
  assert.equal(players[149].ranking, 150);
  assert.ok(players.some(player => player.country === ''));
  assert.equal(players[0].imageUrl, undefined);
});

test('HTML responses and stale ATP PDFs are rejected before sync', async () => {
  await assert.rejects(parseAtpRankings(Buffer.from('<html>Denied</html>')), /not a PDF/);
  await assert.rejects(parseAtpRankings(atp, Date.parse('2026-11-01')), /stale/);
});

test('WTA comma-separated points retain all digits; rank excludes movement', () => {
  const players = parseWtaRankings(wtaHtml);
  assert.equal(players.length, 50);
  assert.deepEqual([players[0].name, players[0].ranking, players[0].points, players[0].age], ['Elena Rybakina', 1, 9901, 27]);
  assert.equal(players[20].ranking, 21);
  assert.equal(players[0].ranking_date, '2026-09-28');
  assert.equal(players[0].source, 'wta');
});

test('challenge pages, partial feeds and duplicate ranks cannot become snapshots', async () => {
  assert.throws(() => parseWtaRankings('<html>Access denied</html>'), /Incomplete/);
  const players = await parse();
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
  const players = await parse();
  const fake = fakeClient([
    { id: 'favorite-player', name: players[0].name.normalize('NFD'), source: 'ATP', bio: 'Editorial biography' },
    { id: 'retired-player', name: 'Retired Player', source: 'atp', ranking: 2 },
    { id: 'female-player', name: 'Female Player', source: 'wta', ranking: 1 },
  ]);
  const result = await syncPlayerData(players, 'atp', fake.client);
  assert.equal(result.updated, 1);
  assert.equal(result.created, 149);
  assert.equal(result.unranked, 1);
  assert.equal(fake.updates[0].id, 'favorite-player');
  assert.equal(fake.updates[0].source, 'atp');
  assert.equal(fake.updates[0].bio, undefined); // PATCH preserves editorial fields.
  assert.equal(fake.updates.find(row => row.id === 'retired-player').ranking, null);
  assert.ok(!fake.updates.some(row => row.id === 'female-player'));
});

test('a failed database write never retires the previous players or reports success', async () => {
  const players = await parse();
  const fake = fakeClient([
    { id: 'first', name: players[0].name, source: 'atp' },
    { id: 'second', name: players[1].name, source: 'atp' },
    { id: 'old', name: 'Old Player', source: 'atp' },
  ], players[1].name);
  await assert.rejects(syncPlayerData(players, 'atp', fake.client), /Database unavailable/);
  assert.ok(!fake.updates.some(row => row.id === 'old'));
});

test('source migration keeps IDs for ATP preferred names and does not overwrite profile metadata', async () => {
  const players = await parse();
  const old = { id: 'existing-favorite', name: 'Bu Yunchaokete', source: 'atp', external_id: 'original-provider-id', imageUrl: 'existing-photo', age: 24 };
  const fake = fakeClient([{ id: 'duplicate', name: 'Yunchaokete Bu', source: 'atp' }, old]);
  await syncPlayerData(players, 'atp', fake.client);
  const saved = fake.updates.find(row => row.id === old.id);
  assert.equal(saved.name, 'Yunchaokete Bu');
  assert.equal(saved.imageUrl, undefined);
  assert.equal(saved.age, undefined);
});

test('tied ranks are valid but unexplained gaps are rejected', async () => {
  const players = await parse();
  const tied = players.map(player => ({ ...player }));
  tied[99].ranking = 99;
  assert.equal(validateRankings(tied).length, 150);
  tied[49].ranking = 52;
  assert.throws(() => validateRankings(tied), /missing/);
});
