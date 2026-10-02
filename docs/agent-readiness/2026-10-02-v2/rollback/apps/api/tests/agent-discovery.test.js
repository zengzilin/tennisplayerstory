import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import express from 'express';
import router from '../src/routes/agent-discovery.js';
import { parseLookupInput, publicArticle } from '../src/utils/agentLookup.js';

const app = express();
app.use(router);
app.get(['/', '/en', '/en/stories', '/en/login'], (req, res) => res.type('html').send('<html><body>TennisHub</body></html>'));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
let server;
let origin;
test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));

test('public page lookup finds a known page, reads it, handles missing and non-English routes', async () => {
  const search = await (await fetch(`${origin}/api/agent/lookup?q=rankings`)).json();
  assert.ok(search.items.some(item => item.id === 'rankings'));
  const read = await (await fetch(`${origin}/api/agent/lookup?id=rankings&lang=zh`)).json();
  assert.equal(read.items.length, 1);
  assert.equal(read.items[0].source_url, 'https://tennisplayerstory.com/zh/rankings');
  const missing = await fetch(`${origin}/api/agent/lookup?id=does-not-exist`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).found, false);
  const empty = await fetch(`${origin}/api/agent/lookup?q=no-such-phrase`);
  assert.equal(empty.status, 200);
  assert.deepEqual((await empty.json()).items, []);
});

test('invalid, oversized, duplicate and non-integer inputs are rejected', async () => {
  for (const input of [{ limit: 21 }, { limit: 1.5 }, { offset: -1 }, { q: ['a', 'b'] }, { q: 'x'.repeat(121) }, { kind: 'users' }, { lang: 'xx' }, { limit: true }, { admin: true }]) assert.throws(() => parseLookupInput(input));
  for (const query of ['limit=21', 'kind=users', 'q=a&q=b', 'offset=Infinity']) assert.equal((await fetch(`${origin}/api/agent/lookup?${query}`)).status, 400);
});

test('approved article projection excludes private fields and preserves translation, unknown dates and truncation', () => {
  const row = { id: 'known', data: { status: 'approved', title: 'Original', content: 'original', password: 'secret', author: 'private-id', translations: { zh: { title: '中文标题', content: '中'.repeat(24001) } } } };
  const translated = publicArticle(row, 'zh', true);
  assert.equal(translated.title, '中文标题');
  assert.equal(translated.language, 'zh');
  assert.equal(translated.content.length, 24000);
  assert.equal(translated.content_truncated, true);
  assert.equal(translated.updated, null);
  assert.ok(!('password' in translated));
  assert.ok(!('author' in translated));
  const fallback = publicArticle(row, 'ja', true);
  assert.equal(fallback.title, 'Original');
  assert.equal(fallback.language, null);
  assert.equal(fallback.translation_available, false);
  assert.equal(publicArticle({ ...row, data: { ...row.data, status: 'draft' } }, 'en', true), null);
});

test('Markdown and HTML negotiation remain distinct in both request orders, including q=0', async () => {
  for (const accept of ['text/markdown', 'text/html', 'text/html', 'text/markdown', 'text/markdown;q=0,text/html']) {
    const response = await fetch(`${origin}/`, { headers: { Accept: accept } });
    const expected = accept === 'text/markdown' ? 'text/markdown' : 'text/html';
    assert.match(response.headers.get('content-type'), new RegExp(expected));
    assert.match(response.headers.get('vary'), /Accept/);
    assert.match(response.headers.get('link'), /rel="api-catalog"/);
    const body = await response.text();
    assert.match(body, expected === 'text/markdown' ? /rankings/ : /<html>/);
  }
  const privatePage = await fetch(`${origin}/en/login`, { headers: { Accept: 'text/markdown' } });
  assert.match(privatePage.headers.get('content-type'), /text\/html/);
});

test('served skill bytes match index digest and all ARD resource links work', async () => {
  const index = await (await fetch(`${origin}/.well-known/agent-skills/index.json`)).json();
  const bytes = Buffer.from(await (await fetch(`${origin}${new URL(index.skills[0].url).pathname}`)).arrayBuffer());
  assert.equal(index.skills[0].digest, `sha256:${createHash('sha256').update(bytes).digest('hex')}`);
  const ardResponse = await fetch(`${origin}/.well-known/ai-catalog.json`);
  assert.equal(ardResponse.headers.get('access-control-allow-origin'), '*');
  assert.equal(ardResponse.headers.get('access-control-allow-credentials'), null);
  const ard = await ardResponse.json();
  for (const entry of ard.entries) {
    assert.equal(Boolean(entry.url) !== Boolean(entry.data), true);
    assert.equal((await fetch(`${origin}${new URL(entry.url).pathname}`)).status, 200);
  }
  const catalog = await fetch(`${origin}/.well-known/api-catalog`);
  assert.match(catalog.headers.get('content-type'), /application\/linkset\+json/);
  assert.ok((await catalog.json()).linkset[0]['service-desc']);
  const auth = await (await fetch(`${origin}/auth.md`)).text();
  assert.match(auth, /^# TennisHub auth.md/);
  assert.match(auth, /not an OAuth authorization server/);
});

test('sitemap advertises only real public routes and robots declares content use without granting training', async () => {
  const { sitemapXml, robotsTxt } = await import('../src/routes/sitemap.js');
  let body;
  const response = { type() { return this; }, send(value) { body = value; } };
  await sitemapXml({}, response);
  assert.match(body, /https:\/\/tennisplayerstory.com\/de\/news/);
  assert.ok(!body.includes('/players/'));
  assert.ok(!body.includes('/admin'));
  robotsTxt({}, response);
  assert.match(body, /Content-Signal: search=yes, ai-input=yes, ai-train=no/);
  assert.match(body, /Sitemap: https:\/\/tennisplayerstory.com\/sitemap.xml/);
});
