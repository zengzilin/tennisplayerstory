import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { refreshPlayerRankings } from '../utils/playerDataSync.js';

const router = express.Router();

for (const source of ['atp', 'wta', 'all']) {
  router.post(`/${source}`, async (req, res) => {
    const result = await refreshPlayerRankings({
      sources: source === 'all' ? ['atp', 'wta'] : [source],
      dryRun: req.query.dryRun === 'true',
    });
    const counts = source === 'all' ? {} : result.sources[source];
    res.status(result.success ? 200 : 502).json({ ...result, ...counts });
  });
}

router.post('/itf', (req, res) => {
  res.status(410).json({ success: false, error: 'WTA rankings are not ITF rankings. ITF feed is not configured.' });
});

router.get('/status', async (req, res) => {
  const status = {
    atp: null,
    wta: null,
    itf: null,
    feeds: {},
  };

  try {
    const logs = await pb.collection('scrape_logs').getList(1, 100, {
      sort: '-timestamp',
      filter: 'status = "success"',
    });

    const sourceMap = {};
    logs.items.forEach(log => {
      if (!sourceMap[log.source]) {
        sourceMap[log.source] = log.timestamp;
      }
    });

    status.atp = sourceMap['ATP'] || null;
    status.wta = sourceMap['WTA'] || null;
    for (const source of ['atp', 'wta']) {
      const log = logs.items.find(item => item.source?.toLowerCase() === source);
      if (log) status.feeds[source] = { rankingDate: log.ranking_date, sourceUrl: log.source_url };
    }
  } catch (error) {
    logger.error('Failed to fetch scrape status:', error);
  }

  res.json(status);
});

/**
 * GET /scrape/logs - Get recent scraping logs
 */
router.get('/logs', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const page = parseInt(req.query.page) || 1;

  const logs = await pb.collection('scrape_logs').getList(page, limit, {
    sort: '-timestamp',
  });

  res.json(logs.items);
});

/**
 * GET /scrape/stats - Get scraping statistics
 */
router.get('/stats', async (req, res) => {
  const stats = {
    totalPlayers: 0,
    recentUpdates: 0,
  };

  try {
    // Get total players count
    const playersResult = await pb.collection('players').getList(1, 1);
    stats.totalPlayers = playersResult.totalItems;

    // Get recent updates (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentLogsResult = await pb.collection('scrape_logs').getList(1, 1, {
      filter: `timestamp >= "${oneDayAgo}" && status = "success"`,
    });
    stats.recentUpdates = recentLogsResult.totalItems;
  } catch (error) {
    logger.error('Failed to fetch scraping stats:', error);
  }

  res.json(stats);
});

export default router;
