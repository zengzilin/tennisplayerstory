import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { scrapeRateLimiter } from '../src/middleware/rateLimiter.js';

test('reading ranking status does not consume the five hourly scrape requests', async context => {
  const app = express();
  app.use('/scrape', scrapeRateLimiter, (request, response) => response.json({ success: true }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  context.after(() => { server.closeAllConnections(); server.close(); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (let index = 0; index < 6; index++) {
    const response = await fetch(`${origin}/scrape/status`);
    assert.equal(response.status, 200);
    await response.text();
  }
  for (let index = 0; index < 6; index++) {
    const response = await fetch(`${origin}/scrape/all`, { method: 'POST' });
    assert.equal(response.status, index === 5 ? 429 : 200);
    await response.text();
  }
});
