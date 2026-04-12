import 'dotenv/config';
import express from 'express';
import * as cheerio from 'cheerio';
import pb from '../utils/pocketbaseClient.js';
import { syncPlayerData } from '../utils/playerDataSync.js';
import logger from '../utils/logger.js';

const router = express.Router();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff: 1s, 2s, 4s

/**
 * Fetch with retry logic and timeout
 */
async function fetchWithRetry(url, options = {}) {
  let lastError;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.info(`Fetching ${url} (attempt ${attempt + 1}/${MAX_RETRIES})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': ACCEPT_LANGUAGE,
          'Referer': options.referer || url,
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      logger.info(`Response status: ${response.status} ${response.statusText}`);
      logger.info(`Response headers: Content-Type=${response.headers.get('content-type')}, Content-Length=${response.headers.get('content-length')}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      logger.warn(`Fetch attempt ${attempt + 1} failed: ${error.message}`);
      
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt];
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to fetch after ${MAX_RETRIES} attempts: ${lastError.message}`);
}

/**
 * Validate scraped player data
 */
function validatePlayerData(player) {
  return (
    player.name &&
    typeof player.name === 'string' &&
    player.name.trim().length > 0 &&
    player.ranking &&
    !isNaN(parseInt(player.ranking)) &&
    player.country &&
    typeof player.country === 'string' &&
    player.country.trim().length > 0 &&
    player.points !== undefined &&
    !isNaN(parseInt(player.points))
  );
}

/**
 * Parse ESPN tennis rankings table (shared by ATP, WTA, ITF scrapers).
 * ESPN renders the table server-side and uses a consistent structure.
 */
function parseEspnRankings($, source) {
  const players = [];
  // ESPN uses <tr class="Table__TR ... " data-idx="N"> for each ranking row
  const tableRows = $('tr[data-idx]');
  logger.info(`Found ${tableRows.length} rows with selector 'tr[data-idx]'`);

  tableRows.each((index, element) => {
    try {
      const $row = $(element);

      // Rank: first <span class="rank_column">
      const ranking = $row.find('span.rank_column').first().text().trim();

      // Name and profile URL: the AnchorLink inside the player cell
      const nameAnchor = $row.find('a.AnchorLink');
      const name = nameAnchor.text().trim();
      const href = nameAnchor.attr('href') || '';
      const profileUrl = href.startsWith('http') ? href : (href ? `https://www.espn.com${href}` : '');

      // Country: img title attribute (e.g. title="Spain")
      const countryImg = $row.find('img.Logo__sm');
      const country = countryImg.attr('title')?.trim() || '';

      // Points and age: the two plain <span class=""> cells after the player cell
      const plainSpans = $row.find('td.Table__TD span[class=""]');
      const points = plainSpans.eq(0).text().trim().replace(/[^0-9]/g, '');
      const ageText = plainSpans.eq(1).text().trim();

      const player = {
        name,
        ranking: parseInt(ranking) || 0,
        country,
        points: parseInt(points) || 0,
        age: ageText ? parseInt(ageText) : null,
        profileUrl,
        source,
      };

      if (validatePlayerData(player)) {
        logger.debug(`Extracted player: ${player.name} (Rank: ${player.ranking}, Country: ${player.country}, Points: ${player.points})`);
        players.push(player);
      } else {
        logger.warn(`Invalid player data: ${JSON.stringify(player)}`);
      }
    } catch (error) {
      logger.error(`Error parsing ESPN row ${index}: ${error.message}`);
    }
  });

  return players;
}

/**
 * POST /scrape/atp - Scrape ATP rankings from ESPN (atptour.com blocks server requests)
 */
router.post('/atp', async (req, res) => {
  const timestamp = new Date().toISOString();
  let htmlSnippet = '';

  try {
    logger.info('Starting ATP scraping via ESPN...');

    const response = await fetchWithRetry('https://www.espn.com/tennis/rankings', {
      referer: 'https://www.espn.com/tennis/',
    });

    const html = await response.text();
    htmlSnippet = html.substring(0, 300);
    logger.info(`HTML snippet (first 300 chars): ${htmlSnippet}`);

    const $ = cheerio.load(html);
    const players = parseEspnRankings($, 'ATP');

    if (players.length === 0) {
      throw new Error('No valid player data extracted from ESPN ATP rankings');
    }

    logger.info(`Successfully extracted ${players.length} ATP players`);

    // Sync to database
    const syncResult = await syncPlayerData(players, 'ATP');

    // Log scrape activity
    await pb.collection('scrape_logs').create({
      source: 'ATP',
      status: 'success',
      playersCount: players.length,
      syncResult: JSON.stringify(syncResult),
      timestamp,
    }).catch(err => logger.error('Failed to log ATP scrape:', err));

    res.json({
      success: true,
      source: 'atp',
      playersCreated: syncResult.created,
      playersUpdated: syncResult.updated,
      message: `Successfully scraped ${players.length} ATP players`,
      timestamp,
    });
  } catch (error) {
    logger.error(`ATP scraping failed: ${error.message}`);

    // Log failed scrape
    await pb.collection('scrape_logs').create({
      source: 'ATP',
      status: 'failed',
      error: error.message,
      htmlSnippet,
      timestamp,
    }).catch(err => logger.error('Failed to log ATP error:', err));

    throw error;
  }
});

/**
 * POST /scrape/wta - Scrape WTA rankings
 */
router.post('/wta', async (req, res) => {
  const timestamp = new Date().toISOString();
  let htmlSnippet = '';

  try {
    logger.info('Starting WTA scraping...');

    const response = await fetchWithRetry('https://www.wtatennis.com/rankings/singles', {
      referer: 'https://www.wtatennis.com/',
    });

    const html = await response.text();
    htmlSnippet = html.substring(0, 300);
    logger.info(`HTML snippet (first 300 chars): ${htmlSnippet}`);

    const $ = cheerio.load(html);
    const players = [];

    // WTA uses player-row class for ranking table rows
    logger.info('Attempting to parse WTA rankings table with selectors: tr.player-row');

    let tableRows = $('tr.player-row');
    logger.info(`Found ${tableRows.length} player rows with selector 'tr.player-row'`);

    if (tableRows.length === 0) {
      // Try generic tbody tr as fallback
      tableRows = $('tbody tr');
      logger.info(`Trying alternative selector 'tbody tr': found ${tableRows.length} rows`);
    }

    if (tableRows.length === 0) {
      throw new Error('No ranking table found - tried selectors: tr.player-row, tbody tr');
    }

    tableRows.each((index, element) => {
      try {
        const $row = $(element);

        // Extract rank from first td
        const ranking = $row.find('td.player-row__cell--rank').text().trim();

        // Extract player name from data attribute (more reliable than parsing nested HTML)
        const name = $row.attr('data-player-name')?.trim();

        // Extract country code from flag class or country span
        const countrySpan = $row.find('span.player-cell__country');
        const country = countrySpan.text().trim();

        // Extract points from the points cell
        const pointsText = $row.find('td.player-row__cell--points').text().trim();
        const points = pointsText.replace(/[^0-9]/g, '');

        // Extract age from age cell
        const ageText = $row.find('td.player-row__cell--age').text().trim();

        const player = {
          name,
          ranking: parseInt(ranking) || 0,
          country,
          points: parseInt(points) || 0,
          age: ageText ? parseInt(ageText) : null,
          profileUrl: '', // WTA page doesn't expose profile URLs in ranking table
          source: 'WTA',
        };

        if (validatePlayerData(player)) {
          logger.debug(`Extracted player: ${player.name} (Rank: ${player.ranking}, Country: ${player.country}, Points: ${player.points})`);
          players.push(player);
        } else {
          logger.warn(`Invalid player data: ${JSON.stringify(player)}`);
        }
      } catch (error) {
        logger.error(`Error parsing row ${index}: ${error.message}`);
      }
    });

    if (players.length === 0) {
      throw new Error('No valid player data extracted from WTA website');
    }

    logger.info(`Successfully extracted ${players.length} WTA players`);

    // Sync to database
    const syncResult = await syncPlayerData(players, 'WTA');

    // Log scrape activity
    await pb.collection('scrape_logs').create({
      source: 'WTA',
      status: 'success',
      playersCount: players.length,
      syncResult: JSON.stringify(syncResult),
      timestamp,
    }).catch(err => logger.error('Failed to log WTA scrape:', err));

    res.json({
      success: true,
      source: 'wta',
      playersCreated: syncResult.created,
      playersUpdated: syncResult.updated,
      message: `Successfully scraped ${players.length} WTA players`,
      timestamp,
    });
  } catch (error) {
    logger.error(`WTA scraping failed: ${error.message}`);

    // Log failed scrape
    await pb.collection('scrape_logs').create({
      source: 'WTA',
      status: 'failed',
      error: error.message,
      htmlSnippet,
      timestamp,
    }).catch(err => logger.error('Failed to log WTA error:', err));

    throw error;
  }
});

/**
 * POST /scrape/itf - Scrape ITF rankings
 */
router.post('/itf', async (req, res) => {
  const timestamp = new Date().toISOString();
  let htmlSnippet = '';
  
  try {
    logger.info('Starting ITF scraping via ESPN WTA rankings (itftennis.com blocks server requests)...');

    const response = await fetchWithRetry('https://www.espn.com/tennis/rankings/_/type/wta', {
      referer: 'https://www.espn.com/tennis/',
    });

    const html = await response.text();
    htmlSnippet = html.substring(0, 300);
    logger.info(`HTML snippet (first 300 chars): ${htmlSnippet}`);

    const $ = cheerio.load(html);
    const players = parseEspnRankings($, 'ITF');

    if (players.length === 0) {
      throw new Error('No valid player data extracted from ESPN WTA rankings (used for ITF)');
    }

    logger.info(`Successfully extracted ${players.length} ITF players`);

    // Sync to database
    const syncResult = await syncPlayerData(players, 'ITF');

    // Log scrape activity
    await pb.collection('scrape_logs').create({
      source: 'ITF',
      status: 'success',
      playersCount: players.length,
      syncResult: JSON.stringify(syncResult),
      timestamp,
    }).catch(err => logger.error('Failed to log ITF scrape:', err));

    res.json({
      success: true,
      source: 'itf',
      playersCreated: syncResult.created,
      playersUpdated: syncResult.updated,
      message: `Successfully scraped ${players.length} ITF players`,
      timestamp,
    });
  } catch (error) {
    logger.error(`ITF scraping failed: ${error.message}`);
    
    // Log failed scrape
    await pb.collection('scrape_logs').create({
      source: 'ITF',
      status: 'failed',
      error: error.message,
      htmlSnippet,
      timestamp,
    }).catch(err => logger.error('Failed to log ITF error:', err));
    
    throw error;
  }
});

/**
 * POST /scrape/all - Scrape all sources sequentially
 */
router.post('/all', async (req, res) => {
  const timestamp = new Date().toISOString();
  const results = {
    success: true,
    data: {
      atp: null,
      wta: null,
      itf: null,
    },
    errors: {},
    message: '',
    timestamp,
  };

  // Scrape ATP
  try {
    logger.info('Scraping ATP in /all endpoint via ESPN...');
    const atpResponse = await fetchWithRetry('https://www.espn.com/tennis/rankings', {
      referer: 'https://www.espn.com/tennis/',
    });
    const atpHtml = await atpResponse.text();
    const atpPlayers = parseEspnRankings(cheerio.load(atpHtml), 'ATP');

    if (atpPlayers.length > 0) {
      const syncResult = await syncPlayerData(atpPlayers, 'ATP');
      results.data.atp = { count: atpPlayers.length, created: syncResult.created, updated: syncResult.updated };
      await pb.collection('scrape_logs').create({
        source: 'ATP',
        status: 'success',
        playersCount: atpPlayers.length,
        syncResult: JSON.stringify(syncResult),
        timestamp,
      }).catch(err => logger.error('Failed to log ATP scrape:', err));
    }
  } catch (error) {
    results.errors.atp = error.message;
    results.success = false;
    logger.error(`ATP scraping in /all failed: ${error.message}`);
    await pb.collection('scrape_logs').create({
      source: 'ATP',
      status: 'failed',
      error: error.message,
      timestamp,
    }).catch(err => logger.error('Failed to log ATP error:', err));
  }

  // Scrape WTA
  try {
    logger.info('Scraping WTA in /all endpoint...');
    const wtaResponse = await fetchWithRetry('https://www.wtatennis.com/rankings/singles', {
      referer: 'https://www.wtatennis.com/',
    });
    const wtaHtml = await wtaResponse.text();
    const $wta = cheerio.load(wtaHtml);
    const wtaPlayers = [];

    let wtaRows = $wta('tr.player-row');
    if (wtaRows.length === 0) wtaRows = $wta('tbody tr');

    wtaRows.each((index, element) => {
      try {
        const $row = $wta(element);
        const ranking = $row.find('td.player-row__cell--rank').text().trim();
        const name = $row.attr('data-player-name')?.trim();
        const country = $row.find('span.player-cell__country').text().trim();
        const points = $row.find('td.player-row__cell--points').text().trim().replace(/[^0-9]/g, '');
        const ageText = $row.find('td.player-row__cell--age').text().trim();
        const player = { name, ranking: parseInt(ranking) || 0, country, points: parseInt(points) || 0, age: ageText ? parseInt(ageText) : null, profileUrl: '', source: 'WTA' };
        if (validatePlayerData(player)) wtaPlayers.push(player);
      } catch (err) {
        logger.error(`Error parsing WTA row ${index} in /all: ${err.message}`);
      }
    });

    if (wtaPlayers.length > 0) {
      const syncResult = await syncPlayerData(wtaPlayers, 'WTA');
      results.data.wta = { count: wtaPlayers.length, created: syncResult.created, updated: syncResult.updated };
      await pb.collection('scrape_logs').create({
        source: 'WTA',
        status: 'success',
        playersCount: wtaPlayers.length,
        syncResult: JSON.stringify(syncResult),
        timestamp,
      }).catch(err => logger.error('Failed to log WTA scrape:', err));
    }
  } catch (error) {
    results.errors.wta = error.message;
    results.success = false;
    logger.error(`WTA scraping in /all failed: ${error.message}`);
    await pb.collection('scrape_logs').create({
      source: 'WTA',
      status: 'failed',
      error: error.message,
      timestamp,
    }).catch(err => logger.error('Failed to log WTA error:', err));
  }

  // Scrape ITF
  try {
    logger.info('Scraping ITF in /all endpoint via ESPN WTA rankings...');
    const itfResponse = await fetchWithRetry('https://www.espn.com/tennis/rankings/_/type/wta', {
      referer: 'https://www.espn.com/tennis/',
    });
    const itfHtml = await itfResponse.text();
    const itfPlayers = parseEspnRankings(cheerio.load(itfHtml), 'ITF');

    if (itfPlayers.length > 0) {
      const syncResult = await syncPlayerData(itfPlayers, 'ITF');
      results.data.itf = { count: itfPlayers.length, created: syncResult.created, updated: syncResult.updated };
      await pb.collection('scrape_logs').create({
        source: 'ITF',
        status: 'success',
        playersCount: itfPlayers.length,
        syncResult: JSON.stringify(syncResult),
        timestamp,
      }).catch(err => logger.error('Failed to log ITF scrape:', err));
    }
  } catch (error) {
    results.errors.itf = error.message;
    results.success = false;
    logger.error(`ITF scraping in /all failed: ${error.message}`);
    await pb.collection('scrape_logs').create({
      source: 'ITF',
      status: 'failed',
      error: error.message,
      timestamp,
    }).catch(err => logger.error('Failed to log ITF error:', err));
  }

  const successCount = Object.keys(results.data).filter(key => results.data[key] !== null).length;
  const failureCount = Object.keys(results.errors).length;

  if (successCount === 3) {
    results.message = 'All sources scraped successfully';
  } else if (successCount > 0) {
    results.message = `Partial success: ${successCount} sources completed, ${failureCount} failed`;
  } else {
    results.message = 'All sources failed';
    throw new Error(results.message);
  }

  res.json(results);
});

/**
 * GET /scrape/status - Get last update timestamps for each source
 */
router.get('/status', async (req, res) => {
  const status = {
    atp: null,
    wta: null,
    itf: null,
  };

  try {
    const logs = await pb.collection('scrape_logs').getList(1, 100, {
      sort: '-timestamp',
    });

    const sourceMap = {};
    logs.items.forEach(log => {
      if (!sourceMap[log.source]) {
        sourceMap[log.source] = log.timestamp;
      }
    });

    status.atp = sourceMap['ATP'] || null;
    status.wta = sourceMap['WTA'] || null;
    status.itf = sourceMap['ITF'] || null;
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
