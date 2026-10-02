import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import router from '../src/routes/tennis-brief.js';

const realFetch = globalThis.fetch;
const app = express();
app.use('/hcgi/api/news/brief', router);
let server;
let origin;
test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterEach(() => { globalThis.fetch = realFetch; });
test.after(() => new Promise(resolve => server.close(resolve)));

test('news proxy preserves publisher content and forwards supported filters', async () => {
  const payload = { articles: [{ id: 'abc', title: 'Original headline', source_name: 'BBC Sport', excerpt: 'Publisher excerpt' }], page: 2, has_more: true };
  globalThis.fetch = async (url, options) => {
    assert.equal(url.origin, 'https://tennis-brief.zengzilin2016.workers.dev');
    assert.equal(url.pathname, '/api/v1/articles');
    assert.deepEqual(Object.fromEntries(url.searchParams), { q: 'Gauff', source: 'bbc', topic: 'US tennis', page: '2' });
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
  };
  const response = await realFetch(`${origin}/hcgi/api/news/brief/articles?q=Gauff&source=bbc&topic=US%20tennis&page=2`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
  assert.deepEqual(await response.json(), payload);
});

test('source status including failures is preserved', async () => {
  const payload = { sources: [{ id: 'bbc', last_success: null, last_error: 'Feed HTTP 503' }] };
  globalThis.fetch = async url => {
    assert.equal(url.pathname, '/api/v1/status');
    return new Response(JSON.stringify(payload));
  };
  const response = await realFetch(`${origin}/hcgi/api/news/brief/status`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), payload);
});

test('invalid filters never reach the upstream', async () => {
  globalThis.fetch = () => { throw new Error('Must not fetch'); };
  for (const query of ['page=0', 'page=101', 'page=1.5', 'source=unknown', 'source=bbc&source=espn', 'topic=invalid', `q=${'a'.repeat(101)}`]) {
    assert.equal((await realFetch(`${origin}/hcgi/api/news/brief/articles?${query}`)).status, 400);
  }
});

test('upstream failures and invalid payloads yield a retryable uncached error', async () => {
  for (const upstream of [() => { throw new Error('Timeout'); }, () => new Response('Unavailable', { status: 503 }), () => new Response('<html>'), () => new Response('{}')]) {
    globalThis.fetch = upstream;
    const response = await realFetch(`${origin}/hcgi/api/news/brief/articles`);
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'Tennis Brief is temporarily unavailable' });
  }
});
