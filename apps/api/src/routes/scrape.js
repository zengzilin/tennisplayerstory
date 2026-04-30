import 'dotenv/config';
import express from 'express';
import * as cheerio from 'cheerio';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff: 1s, 2s, 4s

/**
 * Fetch with retry logic and timeout
 * @param {string} url - URL to fetch
 * @param {string} referer - Referer header value
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, referer = '') {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.info(`Fetching ${url} (attempt ${attempt + 1}/${MAX_RETRIES})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': ACCEPT_LANGUAGE,
          'Referer': referer || url,
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
 * Extract integer from text, removing non-numeric characters
 * @param {string} text - Text to extract integer from
 * @returns {number} Extracted integer or 0
 */
function cleanInt(text) {
  if (!text) return 0;
  const match = text.toString().match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

/**
 * Validate player data
 * @param {Object} player - Player object to validate
 * @returns {boolean} True if player data is valid
 */
function validatePlayer(player) {
  const isValid =
    player.name &&
    typeof player.name === 'string' &&
    player.name.trim().length > 0 &&
    player.ranking &&
    !isNaN(parseInt(player.ranking)) &&
    parseInt(player.ranking) > 0 &&
    player.country &&
    typeof player.country === 'string' &&
    player.country.trim().length > 0 &&
    player.points !== undefined &&
    !isNaN(parseInt(player.points)) &&
    parseInt(player.points) >= 0;

  return isValid;
}

/**
 * Parse ESPN tennis rankings table (ATP/ITF)
 * @param {string} html - HTML content
 * @param {string} source - Source identifier (ATP or ITF)
 * @returns {Array} Array of player objects
 */
function parseEspnRankings(html, source) {
  const players = [];
  const $ = cheerio.load(html);

  logger.debug(`HTML preview (first 200 chars): ${html.substring(0, 200)}`);

  // ESPN uses <tr class="Table__TR ... " data-idx="N"> for each ranking row
  const tableRows = $('tr[data-idx]');
  logger.info(`Found ${tableRows.length} rows with selector 'tr[data-idx]'`);

  tableRows.each((index, element) => {
    try {
      const $row = $(element);

      // Rank: first <span class="rank_column">
      const ranking = cleanInt($row.find('span.rank_column').first().text());

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
      const points = cleanInt(plainSpans.eq(0).text());
      const ageText = plainSpans.eq(1).text().trim();
      const age = ageText ? cleanInt(ageText) : null;

      const player = {
        name,
        ranking,
        country,
        points,
        age,
        profileUrl,
        source,
      };

      if (validatePlayer(player)) {
        logger.debug(`Extracted player: ${player.name} (Rank: ${player.ranking}, Country: ${player.country}, Points: ${player.points})`);
        players.push(player);
      } else {
        logger.warn(`Invalid player data: ${JSON.stringify(player)}`);
      }
    } catch (error) {
      logger.error(`Error parsing ESPN row ${index}: ${error.message}`);
    }
  });

  // Log first 5 extracted players for verification
  if (players.length > 0) {
    logger.info(`First 5 extracted ${source} players:`);
    players.slice(0, 5).forEach((p, i) => {
      logger.info(`  ${i + 1}. ${p.name} - Rank: ${p.ranking}, Country: ${p.country}, Points: ${p.points}`);
    });
  }

  return players;
}

/**
 * Parse WTA tennis rankings
 * @param {string} html - HTML content
 * @returns {Array} Array of player objects
 */
function parseWtaRankings(html) {
  const players = [];
  const $ = cheerio.load(html);

  logger.debug(`HTML preview (first 200 chars): ${html.substring(0, 200)}`);

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
      const ranking = cleanInt($row.find('td.player-row__cell--rank').text());

      // Extract player name from data attribute (more reliable than parsing nested HTML)
      const name = $row.attr('data-player-name')?.trim();

      // Extract country code from flag class or country span
      const countrySpan = $row.find('span.player-cell__country');
      const country = countrySpan.text().trim();

      // Extract points from the points cell
      const pointsText = $row.find('td.player-row__cell--points').text().trim();
      const points = cleanInt(pointsText);

      // Extract age from age cell
      const ageText = $row.find('td.player-row__cell--age').text().trim();
      const age = ageText ? cleanInt(ageText) : null;

      const player = {
        name,
        ranking,
        country,
        points,
        age,
        profileUrl: '', // WTA page doesn't expose profile URLs in ranking table
        source: 'WTA',
      };

      if (validatePlayer(player)) {
        logger.debug(`Extracted player: ${player.name} (Rank: ${player.ranking}, Country: ${player.country}, Points: ${player.points})`);
        players.push(player);
      } else {
        logger.warn(`Invalid player data: ${JSON.stringify(player)}`);
      }
    } catch (error) {
      logger.error(`Error parsing WTA row ${index}: ${error.message}`);
    }
  });

  // Log first 5 extracted players for verification
  if (players.length > 0) {
    logger.info('First 5 extracted WTA players:');
    players.slice(0, 5).forEach((p, i) => {
      logger.info(`  ${i + 1}. ${p.name} - Rank: ${p.ranking}, Country: ${p.country}, Points: ${p.points}`);
    });
  }

  return players;
}

/**
 * Sync players to PocketBase database
 * @param {Array} players - Array of player objects
 * @param {string} source - Source identifier (ATP, WTA, ITF)
 * @returns {Object} Sync results { created, updated, failed }
 */
async function syncPlayers(players, source) {
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
  };

  if (!Array.isArray(players) || players.length === 0) {
    logger.warn(`syncPlayers called with invalid players array for source ${source}`);
    return results;
  }

  logger.info(`Starting sync of ${players.length} players from ${source}`);

  for (const player of players) {
    try {
      // Check if player exists by name and source
      const existingRecords = await pb.collection('players').getList(1, 1, {
        filter: `name = "${player.name.replace(/"/g, '\\"')}" && source = "${source}"`,
      });

      if (existingRecords.items.length > 0) {
        // Update existing player
        const existingPlayer = existingRecords.items[0];
        await pb.collection('players').update(existingPlayer.id, {
          ranking: player.ranking,
          points: player.points,
          country: player.country,
          profile_url: player.profileUrl,
          age: player.age || null,
          last_updated: new Date().toISOString(),
        });
        results.updated++;
        logger.debug(`Updated player: ${player.name} (Rank: ${player.ranking})`);
      } else {
        // Create new player
        await pb.collection('players').create({
          name: player.name,
          ranking: player.ranking,
          country: player.country,
          points: player.points,
          profile_url: player.profileUrl,
          age: player.age || null,
          source: source,
          last_updated: new Date().toISOString(),
        });
        results.created++;
        logger.debug(`Created player: ${player.name} (Rank: ${player.ranking})`);
      }
    } catch (error) {
      logger.error(`Failed to sync player ${player.name} from ${source}: ${error.message}`);
      results.failed++;
    }
  }

  logger.info(`Sync completed for ${source}: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);
  return results;
}

/**
 * Log scrape activity to PocketBase
 * @param {string} source - Source identifier
 * @param {string} status - Status (success or failed)
 * @param {Object} counts - Counts object { created, updated, failed }
 * @param {string} error - Error message (optional)
 */
async function logScrape(source, status, counts, error = null) {
  try {
    const logData = {
      source,
      status,
      timestamp: new Date().toISOString(),
    };

    if (counts) {
      logData.playersCount = counts.created + counts.updated;
      logData.syncResult = JSON.stringify(counts);
    }

    if (error) {
      logData.error = error;
    }

    await pb.collection('scrape_logs').create(logData);
  } catch (err) {
    logger.error(`Failed to log scrape for ${source}: ${err.message}`);
  }
}

/**
 * POST /scrape/atp - Scrape ATP rankings from ESPN
 */
router.post('/atp', async (req, res) => {
  const timestamp = new Date().toISOString();
  const dryRun = req.query.dryRun === 'true';

  try {
    logger.info('Starting ATP scraping via ESPN...');

    const response = await fetchWithRetry('https://www.espn.com/tennis/rankings', 'https://www.espn.com/tennis/');
    const html = await response.text();

    const players = parseEspnRankings(html, 'ATP');

    if (players.length === 0) {
      throw new Error('No valid player data extracted from ESPN ATP rankings');
    }

    logger.info(`Successfully extracted ${players.length} ATP players`);

    let syncResult = { created: 0, updated: 0, failed: 0 };

    if (!dryRun) {
      syncResult = await syncPlayers(players, 'ATP');
      await logScrape('ATP', 'success', syncResult);
    } else {
      logger.info('DRY RUN MODE: Skipping database sync');
    }

    res.json({
      success: true,
      source: 'atp',
      count: players.length,
      created: syncResult.created,
      updated: syncResult.updated,
      failed: syncResult.failed,
      message: `Successfully scraped ${players.length} ATP players`,
      timestamp,
      dryRun,
    });
  } catch (error) {
    logger.error(`ATP scraping failed: ${error.message}`);
    await logScrape('ATP', 'failed', null, error.message);
    throw error;
  }
});

/**
 * POST /scrape/wta - Scrape WTA rankings
 */
router.post('/wta', async (req, res) => {
  const timestamp = new Date().toISOString();
  const dryRun = req.query.dryRun === 'true';

  try {
    logger.info('Starting WTA scraping...');

    const response = await fetchWithRetry('https://www.wtatennis.com/rankings/singles', 'https://www.wtatennis.com/');
    const html = await response.text();

    const players = parseWtaRankings(html);

    if (players.length === 0) {
      throw new Error('No valid player data extracted from WTA website');
    }

    logger.info(`Successfully extracted ${players.length} WTA players`);

    let syncResult = { created: 0, updated: 0, failed: 0 };

    if (!dryRun) {
      syncResult = await syncPlayers(players, 'WTA');
      await logScrape('WTA', 'success', syncResult);
    } else {
      logger.info('DRY RUN MODE: Skipping database sync');
    }

    res.json({
      success: true,
      source: 'wta',
      count: players.length,
      created: syncResult.created,
      updated: syncResult.updated,
      failed: syncResult.failed,
      message: `Successfully scraped ${players.length} WTA players`,
      timestamp,
      dryRun,
    });
  } catch (error) {
    logger.error(`WTA scraping failed: ${error.message}`);
    await logScrape('WTA', 'failed', null, error.message);
    throw error;
  }
});

/**
 * POST /scrape/itf - Scrape ITF rankings via ESPN WTA rankings
 */
router.post('/itf', async (req, res) => {
  const timestamp = new Date().toISOString();
  const dryRun = req.query.dryRun === 'true';

  try {
    logger.info('Starting ITF scraping via ESPN WTA rankings...');

    const response = await fetchWithRetry('https://www.espn.com/tennis/rankings/_/type/wta', 'https://www.espn.com/tennis/');
    const html = await response.text();

    const players = parseEspnRankings(html, 'ITF');

    if (players.length === 0) {
      throw new Error('No valid player data extracted from ESPN WTA rankings (used for ITF)');
    }

    logger.info(`Successfully extracted ${players.length} ITF players`);

    let syncResult = { created: 0, updated: 0, failed: 0 };

    if (!dryRun) {
      syncResult = await syncPlayers(players, 'ITF');
      await logScrape('ITF', 'success', syncResult);
    } else {
      logger.info('DRY RUN MODE: Skipping database sync');
    }

    res.json({
      success: true,
      source: 'itf',
      count: players.length,
      created: syncResult.created,
      updated: syncResult.updated,
      failed: syncResult.failed,
      message: `Successfully scraped ${players.length} ITF players`,
      timestamp,
      dryRun,
    });
  } catch (error) {
    logger.error(`ITF scraping failed: ${error.message}`);
    await logScrape('ITF', 'failed', null, error.message);
    throw error;
  }
});

/**
 * POST /scrape/all - Scrape all sources sequentially
 */
router.post('/all', async (req, res) => {
  const timestamp = new Date().toISOString();
  const dryRun = req.query.dryRun === 'true';

  const results = {
    success: true,
    sources: {
      atp: { success: false, count: 0, created: 0, updated: 0, failed: 0, error: null },
      wta: { success: false, count: 0, created: 0, updated: 0, failed: 0, error: null },
      itf: { success: false, count: 0, created: 0, updated: 0, failed: 0, error: null },
    },
    summary: {
      total_created: 0,
      total_updated: 0,
      total_failed: 0,
    },
    timestamp,
    dryRun,
  };

  // Scrape ATP
  try {
    logger.info('Scraping ATP in /all endpoint via ESPN...');
    const atpResponse = await fetchWithRetry('https://www.espn.com/tennis/rankings', 'https://www.espn.com/tennis/');
    const atpHtml = await atpResponse.text();
    const atpPlayers = parseEspnRankings(atpHtml, 'ATP');

    if (atpPlayers.length > 0) {
      let syncResult = { created: 0, updated: 0, failed: 0 };
      if (!dryRun) {
        syncResult = await syncPlayers(atpPlayers, 'ATP');
        await logScrape('ATP', 'success', syncResult);
      }
      results.sources.atp = {
        success: true,
        count: atpPlayers.length,
        created: syncResult.created,
        updated: syncResult.updated,
        failed: syncResult.failed,
        error: null,
      };
      results.summary.total_created += syncResult.created;
      results.summary.total_updated += syncResult.updated;
      results.summary.total_failed += syncResult.failed;
    }
  } catch (error) {
    results.sources.atp.error = error.message;
    results.success = false;
    logger.error(`ATP scraping in /all failed: ${error.message}`);
    await logScrape('ATP', 'failed', null, error.message);
  }

  // Scrape WTA
  try {
    logger.info('Scraping WTA in /all endpoint...');
    const wtaResponse = await fetchWithRetry('https://www.wtatennis.com/rankings/singles', 'https://www.wtatennis.com/');
    const wtaHtml = await wtaResponse.text();
    const wtaPlayers = parseWtaRankings(wtaHtml);

    if (wtaPlayers.length > 0) {
      let syncResult = { created: 0, updated: 0, failed: 0 };
      if (!dryRun) {
        syncResult = await syncPlayers(wtaPlayers, 'WTA');
        await logScrape('WTA', 'success', syncResult);
      }
      results.sources.wta = {
        success: true,
        count: wtaPlayers.length,
        created: syncResult.created,
        updated: syncResult.updated,
        failed: syncResult.failed,
        error: null,
      };
      results.summary.total_created += syncResult.created;
      results.summary.total_updated += syncResult.updated;
      results.summary.total_failed += syncResult.failed;
    }
  } catch (error) {
    results.sources.wta.error = error.message;
    results.success = false;
    logger.error(`WTA scraping in /all failed: ${error.message}`);
    await logScrape('WTA', 'failed', null, error.message);
  }

  // Scrape ITF
  try {
    logger.info('Scraping ITF in /all endpoint via ESPN WTA rankings...');
    const itfResponse = await fetchWithRetry('https://www.espn.com/tennis/rankings/_/type/wta', 'https://www.espn.com/tennis/');
    const itfHtml = await itfResponse.text();
    const itfPlayers = parseEspnRankings(itfHtml, 'ITF');

    if (itfPlayers.length > 0) {
      let syncResult = { created: 0, updated: 0, failed: 0 };
      if (!dryRun) {
        syncResult = await syncPlayers(itfPlayers, 'ITF');
        await logScrape('ITF', 'success', syncResult);
      }
      results.sources.itf = {
        success: true,
        count: itfPlayers.length,
        created: syncResult.created,
        updated: syncResult.updated,
        failed: syncResult.failed,
        error: null,
      };
      results.summary.total_created += syncResult.created;
      results.summary.total_updated += syncResult.updated;
      results.summary.total_failed += syncResult.failed;
    }
  } catch (error) {
    results.sources.itf.error = error.message;
    results.success = false;
    logger.error(`ITF scraping in /all failed: ${error.message}`);
    await logScrape('ITF', 'failed', null, error.message);
  }

  const successCount = Object.keys(results.sources).filter(key => results.sources[key].success).length;

  if (successCount === 3) {
    results.message = 'All sources scraped successfully';
  } else if (successCount > 0) {
    results.message = `Partial success: ${successCount} sources completed, ${3 - successCount} failed`;
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
