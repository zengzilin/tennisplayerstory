import { Router } from 'express';

const router = Router();
const upstream = 'https://tennis-brief.zengzilin2016.workers.dev';
const topics = ['Tour news', 'Grand Slams', 'US tennis', 'Rankings'];

// Keep ingestion and retention in Tennis Brief; expose its public data on our origin.
router.get(['/articles', '/status'], async (req, res) => {
  const url = new URL(`/api/v1${req.path}`, upstream);
  if (req.path === '/articles') {
    const { q = '', source = '', topic = '', page = '1' } = req.query;
    if (![q, source, topic, page].every(value => typeof value === 'string')
        || q.length > 100 || (source && !['bbc', 'espn'].includes(source))
        || (topic && !topics.includes(topic)) || !/^[1-9]\d?$|^100$/.test(page)) {
      return res.status(400).json({ error: 'Invalid news filters' });
    }
    url.search = new URLSearchParams({ q: q.trim(), source, topic, page }).toString();
  }
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error('News upstream unavailable');
    const data = await response.json();
    if (!data || (req.path === '/articles'
      ? !Array.isArray(data.articles) || typeof data.has_more !== 'boolean'
      : !Array.isArray(data.sources))) {
      throw new Error('Invalid news upstream response');
    }
    res.set('Cache-Control', 'public, max-age=60').json(data);
  } catch {
    res.set('Cache-Control', 'no-store').status(502).json({ error: 'Tennis Brief is temporarily unavailable' });
  }
});

export default router;
