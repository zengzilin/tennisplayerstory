import test from 'node:test';
import assert from 'node:assert/strict';
import pb from '../src/utils/pocketbaseClient.js';
import { publishDailyTrendArticle } from '../src/utils/dailyTrendArticle.js';
import { publishDailyYoutubeArticle } from '../src/utils/dailyYoutubeArticle.js';

test('both automated article jobs save pending drafts and skip an existing draft on rerun', async context => {
  const previousOpenAI = process.env.OPENAI_API_KEY;
  const previousYouTube = process.env.YOUTUBE_API_KEY;
  process.env.OPENAI_API_KEY = 'test-only';
  process.env.YOUTUBE_API_KEY = 'test-only';
  context.after(() => {
    if (previousOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAI;
    if (previousYouTube === undefined) delete process.env.YOUTUBE_API_KEY;
    else process.env.YOUTUBE_API_KEY = previousYouTube;
  });
  const saved = new Map();
  context.mock.method(pb, 'collection', name => ({
    getList: async (page, perPage, options) => ({ items: [...saved.values()].filter(article => options.filter.includes(article.trend_source)) }),
    create: async data => {
      if (name === 'scrape_logs') return { id: 'log' };
      assert.equal(data.status, 'pending');
      assert.equal(data.language, 'zh');
      const record = { ...data, id: `article-${saved.size}` };
      saved.set(data.trend_source, record);
      return record;
    },
  }));
  context.mock.method(globalThis, 'fetch', async value => {
    const url = String(value);
    if (url.includes('trends.google.com')) return new Response('<rss><channel><item><title>Tennis tour</title><description>Tennis news</description><link>https://example.com/tennis</link></item></channel></rss>');
    if (url.includes('googleapis.com/youtube')) return Response.json({ items: [{ id: 'video', snippet: { title: 'Tennis tour', description: 'Tennis', tags: ['tennis'], channelTitle: 'Source', publishedAt: '2026-10-01T00:00:00Z' } }] });
    if (url === 'https://api.openai.com/v1/responses') return Response.json({ output_text: JSON.stringify({ title: 'Source-based test draft', content: '测试正文'.repeat(800), tags: ['tennis'], meta_description: 'Test draft' }) });
    throw new Error('Unexpected network request in article review test');
  });
  for (const publish of [publishDailyTrendArticle, publishDailyYoutubeArticle]) {
    const first = await publish();
    assert.equal(first.skipped, false);
    assert.equal(first.article.status, 'pending');
    const repeat = await publish();
    assert.equal(repeat.skipped, true);
    assert.equal(repeat.article.id, first.article.id);
  }
  assert.equal(saved.size, 2);
});
