import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import pb from '../src/utils/pocketbaseClient.js';
import { initializeScheduler } from '../src/utils/scheduler.js';
import { refreshPlayerRankings } from '../src/utils/playerDataSync.js';
import { rankingSources } from '../src/utils/tennisRankings.js';

const atp = fs.readFileSync(new URL('./fixtures/atp-official-rankings.pdf', import.meta.url));
const wta = fs.readFileSync(new URL('./fixtures/wta-rankings.html', import.meta.url), 'utf8');

test('scheduled task refreshes both tours directly and logs successful database writes', async context => {
  context.mock.method(Date, 'now', () => Date.parse('2026-10-03T00:00:00Z'));
  const requested = [];
  const saved = [];
  const logs = [];
  context.mock.method(globalThis, 'fetch', async url => {
    requested.push(url);
    assert.ok(Object.values(rankingSources).includes(url));
    return new Response(url === rankingSources.atp ? atp : wta);
  });
  context.mock.method(pb, 'collection', name => ({
    getFullList: async () => [],
    create: async data => {
      (name === 'players' ? saved : logs).push(data);
      return { id: String(saved.length) };
    },
  }));
  const oldTrend = process.env.TREND_ARTICLE_STARTUP_CATCHUP;
  const oldYoutube = process.env.YOUTUBE_ARTICLE_STARTUP_CATCHUP;
  process.env.TREND_ARTICLE_STARTUP_CATCHUP = 'false';
  process.env.YOUTUBE_ARTICLE_STARTUP_CATCHUP = 'false';
  const tasks = initializeScheduler();
  try {
    clearTimeout(tasks.rankingsStartupTimer);
    tasks.scrapingTask.stop();
    tasks.trendArticleTask.stop();
    tasks.youtubeArticleTask.stop();
    let completion;
    tasks.scrapingTask.once('task-done', promise => { completion = promise; });
    tasks.scrapingTask.now();
    await completion;
    assert.deepEqual(requested, [rankingSources.atp, rankingSources.wta]);
    assert.equal(saved.length, 200);
    assert.equal(logs.length, 2);
    assert.deepEqual(logs.map(log => [log.source, log.status, log.playersCount]), [['ATP', 'success', 150], ['WTA', 'success', 50]]);
    assert.ok(logs.every(log => log.source_url && log.ranking_date));
  } finally {
    if (oldTrend === undefined) delete process.env.TREND_ARTICLE_STARTUP_CATCHUP;
    else process.env.TREND_ARTICLE_STARTUP_CATCHUP = oldTrend;
    if (oldYoutube === undefined) delete process.env.YOUTUBE_ARTICLE_STARTUP_CATCHUP;
    else process.env.YOUTUBE_ARTICLE_STARTUP_CATCHUP = oldYoutube;
  }
});

test('startup catch-up skips fresh successful snapshots without requesting upstreams', async context => {
  context.mock.method(Date, 'now', () => Date.parse('2026-10-03T00:00:00Z'));
  context.mock.method(globalThis, 'fetch', () => { throw new Error('Fresh snapshots must not be fetched'); });
  context.mock.method(pb, 'collection', () => ({
    getList: async (page, limit, options) => ({ items: [{ timestamp: new Date(Date.now()).toISOString(), source_url: options.filter.includes('ATP') ? rankingSources.atp : rankingSources.wta }] }),
  }));
  const result = await refreshPlayerRankings({ onlyIfStale: true });
  assert.equal(result.success, true);
  assert.ok(result.sources.atp.skipped && result.sources.wta.skipped);
});

test('failed ATP writes are logged as failure while WTA still refreshes', async context => {
  context.mock.method(Date, 'now', () => Date.parse('2026-10-03T00:00:00Z'));
  const logs = [];
  context.mock.method(globalThis, 'fetch', async url => new Response(url === rankingSources.atp ? atp : wta));
  context.mock.method(pb, 'collection', name => ({
    getFullList: async () => [],
    create: async data => {
      if (name === 'players' && data.source === 'atp') throw new Error('Write failed');
      if (name === 'scrape_logs') logs.push(data);
      return { id: data.name };
    },
  }));
  const result = await refreshPlayerRankings();
  assert.equal(result.success, false);
  assert.equal(result.sources.atp.success, false);
  assert.equal(result.sources.wta.count, 50);
  assert.deepEqual(logs.map(log => [log.source, log.status]), [['ATP', 'failed'], ['WTA', 'success']]);
});
