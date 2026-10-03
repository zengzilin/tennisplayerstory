import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { writeFile, mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import router, { loadApprovedStory, renderPublicHtml, storyHtml } from '../src/routes/public-page-html.js';
import { storySource, storyAuthor } from '../../../shared/site-info.mjs';

const template = '<!doctype html><html lang="en"><head><title>TennisHub</title></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>';
const labels = JSON.parse(await readFile(new URL('../../web/src/i18n/locales/zh.json', import.meta.url))).storyDetail;

test('article HTML contains full localized content, safe metadata, author and source without JavaScript', () => {
  const article = { id: 'known', title: '</title><script>bad()</script>', content: 'Original', status: 'approved', author: 'private-id', expand: { author: { name: 'Display Name', email: 'private@example.com' } },
    translations: { zh: { content: '完整正文\n\n<script>bad()</script>' } }, trend_source: 'google_trends', trend_source_url: 'https://www.atptour.com/en/players/example', created: '2026-10-03T00:00:00Z' };
  const html = renderPublicHtml(template, storyHtml(article, 'zh', labels));
  assert.match(html, /完整正文/);
  assert.match(html, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.ok(!html.includes('<script>bad()</script>'));
  assert.ok(!html.includes('private@example.com'));
  assert.ok(!html.includes('private-id'));
  assert.match(html, /Display Name/);
  assert.match(html, /自动化整理内容/);
  assert.match(html, /canonical" href="https:\/\/tennisplayerstory.com\/zh\/stories\/known/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /support@tennisplayerstory.com/);
  assert.match(html, /src="\/assets\/app.js"/);
});

test('approved-only loader uses a parameterized lookup and rejects unpublished records', async () => {
  let calls = 0;
  const pool = { execute: async (sql, params) => {
    calls++;
    assert.match(sql, /status.*approved/);
    assert.deepEqual(params, ['known']);
    return [[{ id: 'known', data: JSON.stringify({ status: 'draft', title: 'Private' }) }]];
  } };
  assert.equal(await loadApprovedStory('bad/id', pool), null);
  assert.equal(calls, 0);
  assert.equal(await loadApprovedStory('known', pool), null);
  const approved = await loadApprovedStory('known', { execute: async () => [[{ id: 'known', data: { status: 'approved', title: 'Public' }, authorName: 'Writer' }]] });
  assert.equal(approved.expand.author.name, 'Writer');
});

test('unsafe source URLs and private author fields cannot become public links or bylines', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:password@example.com']) assert.equal(storySource({ source_url: url }), null);
  assert.equal(storyAuthor({ author: 'private-id', expand: { author: { email: 'private@example.com' } } }), 'TennisHub contributor');
});

test('information pages expose initial content and invalid articles return a real 404', async context => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tennis-public-html-'));
  const index = path.join(directory, 'index.html');
  await writeFile(index, template);
  const app = express();
  app.use((req, res, next) => { res.locals.publicHtmlIndex = index; next(); });
  app.use(router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  context.after(async () => { server.closeAllConnections(); server.close(); await rm(directory, { recursive: true }); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const [page, title] of [['about', '关于我们'], ['contact', '联系我们'], ['privacy-policy', '隐私政策'], ['terms-of-service', '使用条款']]) {
    const response = await fetch(`${origin}/zh/${page}`);
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, new RegExp(title));
    assert.match(body, /support@tennisplayerstory.com/);
    assert.ok(!body.includes('info@tennishub.com'));
  }
  const legacy = await fetch(`${origin}/zh/stories?article=known`, { redirect: 'manual' });
  assert.equal(legacy.status, 301);
  assert.equal(legacy.headers.get('location'), '/zh/stories/known');
  const missing = await fetch(`${origin}/zh/stories/invalid!`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /noindex, follow/);
});
