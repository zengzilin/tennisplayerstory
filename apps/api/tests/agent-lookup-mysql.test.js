// Run only against the disposable localhost Docker fixture named in the v2 report.
import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import express from 'express';

const fixturePort = Number(process.env.AGENT_FIXTURE_MYSQL_PORT);
const enabled = Number.isInteger(fixturePort) && fixturePort > 0;

if (enabled) {
  process.env.MYSQL_HOST = '127.0.0.1';
  process.env.MYSQL_PORT = String(fixturePort);
  process.env.MYSQL_USER = 'root';
  process.env.MYSQL_PASSWORD = '';
  process.env.MYSQL_DATABASE = 'tennishub_agent_fixture';
  process.env.WEBSITE_DOMAIN = 'tennisplayerstory.com';
  const { default: router } = await import('../src/routes/agent-discovery.js');
  const { getPlatformPool } = await import('../src/routes/mysql-platform.js');
  let database;
  let httpServer;
  let origin;

  test.before(async () => {
    database = await mysql.createConnection({ host: '127.0.0.1', port: fixturePort, user: 'root', password: '', database: 'tennishub_agent_fixture' });
    const [identity] = await database.query('SELECT DATABASE() AS name');
    assert.equal(identity[0].name, 'tennishub_agent_fixture');
    await database.query(`CREATE TABLE pb_records (
      collection_name VARCHAR(80) NOT NULL, record_id VARCHAR(40) NOT NULL,
      data JSON NOT NULL, created DATETIME(3), updated DATETIME(3),
      PRIMARY KEY (collection_name, record_id)
    )`);
    const insert = async (collection, id, data, date = '2026-01-02 00:00:00') => database.execute(
      'INSERT INTO pb_records (collection_name, record_id, data, created, updated) VALUES (?, ?, ?, ?, ?)',
      [collection, id, JSON.stringify(data), date, date],
    );
    await insert('articles', 'approved-known', {
      status: 'approved', title: 'Roger Federer', content: 'Won the 2017 Australian Open.', language: 'en',
      author: 'private-author', password: 'not-public', editorial_notes: 'not-public',
      translations: { zh: { title: '罗杰·费德勒', content: '赢得了2017年澳大利亚网球公开赛。' }, ja: { title: 'ロジャー・フェデラー' } },
    }, '2026-01-03 00:00:00');
    await insert('articles', 'draft-known', { status: 'draft', title: 'Roger Federer', content: 'not-public' });
    await insert('users', 'other-collection', { status: 'approved', title: 'Roger Federer', content: 'not-public' });
    await insert('articles', 'literal-percent', { status: 'approved', title: '100% tennis', content: 'Fixture text.' });
    for (let index = 0; index < 26; index++) {
      await insert('articles', `batch-${String(index).padStart(2, '0')}`, { status: 'approved', title: `fixture-batch ${index}`, content: 'Fixture text.' });
    }
    const app = express();
    app.use(router);
    httpServer = app.listen(0, '127.0.0.1');
    await new Promise(resolve => httpServer.once('listening', resolve));
    origin = `http://127.0.0.1:${httpServer.address().port}`;
  });

  test.after(async () => {
    if (httpServer) await new Promise(resolve => httpServer.close(resolve));
    await getPlatformPool().end();
    if (database) {
      await database.query('DROP TABLE IF EXISTS pb_records');
      await database.end();
    }
  });

  test('real SQL and HTTP search expose approved articles only, without private fields', async () => {
    const response = await fetch(`${origin}/api/agent/lookup?kind=articles&q=fEdErEr`);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.items.map(item => item.id), ['approved-known']);
    const serialized = JSON.stringify(result);
    assert.ok(!serialized.includes('not-public'));
    assert.ok(!serialized.includes('private-author'));
    assert.ok(!('content' in result.items[0]));
    const source = new URL(result.items[0].source_url);
    assert.equal(source.pathname, '/en/stories');
    assert.equal(source.searchParams.get('article'), 'approved-known');
    assert.equal(source.hash, '#article-approved-known');
  });

  test('exact reads return full content, stored dates and accurate complete/partial translation qualifiers', async () => {
    const translated = await (await fetch(`${origin}/api/agent/lookup?kind=articles&id=approved-known&lang=zh`)).json();
    assert.equal(translated.items[0].title, '罗杰·费德勒');
    assert.equal(translated.items[0].language, 'zh');
    assert.equal(translated.items[0].translation_complete, true);
    assert.ok(translated.items[0].updated.startsWith('2026-01-03'));
    const partial = await (await fetch(`${origin}/api/agent/lookup?kind=articles&id=approved-known&lang=ja`)).json();
    assert.equal(partial.items[0].language, 'en');
    assert.equal(partial.items[0].title_language, 'ja');
    assert.equal(partial.items[0].content, 'Won the 2017 Australian Open.');
    assert.equal(partial.items[0].translation_complete, false);
  });

  test('missing, draft and injection-shaped identifiers all return 404 without disclosing records', async () => {
    for (const id of ['missing', 'draft-known', 'other-collection', "x' OR 1=1 --"]) {
      const response = await fetch(`${origin}/api/agent/lookup?kind=articles&id=${encodeURIComponent(id)}`);
      assert.equal(response.status, 404);
      const result = await response.json();
      assert.deepEqual(result.items, []);
      assert.equal(result.found, false);
    }
  });

  test('bounded pagination is deterministic and search treats percent as literal text', async () => {
    const first = await (await fetch(`${origin}/api/agent/lookup?kind=articles&q=fixture-batch&limit=20`)).json();
    assert.equal(first.items.length, 20);
    assert.equal(first.next_offset, 20);
    const second = await (await fetch(`${origin}/api/agent/lookup?kind=articles&q=fixture-batch&limit=20&offset=20`)).json();
    assert.equal(second.items.length, 6);
    assert.equal(second.has_more, false);
    assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 26);
    const percent = await (await fetch(`${origin}/api/agent/lookup?kind=articles&q=%25`)).json();
    assert.deepEqual(percent.items.map(item => item.id), ['literal-percent']);
  });

  test('article Markdown contains real database text, dates and retrieval/source links', async () => {
    const response = await fetch(`${origin}/zh/stories`, { headers: { Accept: 'text/markdown' } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/markdown/);
    assert.match(response.headers.get('vary'), /Accept/);
    const body = await response.text();
    assert.match(body, /罗杰·费德勒/);
    assert.match(body, /2017/);
    assert.match(body, /article-approved-known/);
    assert.match(body, /kind=articles&id=approved-known/);
    assert.ok(!body.includes('not-public'));
  });

  test('a real storage outage returns 503, never a successful empty inventory', async () => {
    await database.query('RENAME TABLE pb_records TO pb_records_fixture_outage');
    try {
      const response = await fetch(`${origin}/api/agent/lookup?kind=articles`);
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /storage is unavailable/);
    } finally {
      await database.query('RENAME TABLE pb_records_fixture_outage TO pb_records');
    }
  });
} else {
  test('MySQL integration requires AGENT_FIXTURE_MYSQL_PORT for the isolated Docker fixture', { skip: true }, () => {});
}
