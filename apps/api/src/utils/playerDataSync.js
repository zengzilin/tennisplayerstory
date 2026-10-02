import pb from './pocketbaseClient.js';
import logger from './logger.js';
import { fetchRankings, validateRankings } from './tennisRankings.js';

/** Sync a complete tour snapshot, preserving player IDs and editorial fields. */
export async function syncPlayerData(players, source, client = pb) {
  validateRankings(players);
  const existing = await client.collection('players').getFullList();
  const tourRecords = existing.filter(player => player.source?.toLowerCase() === source);
  const results = { created: 0, updated: 0, failed: 0, unranked: 0 };
  const activeIds = new Set();
  const timestamp = new Date().toISOString();
  for (const player of players) {
    const record = tourRecords.find(item =>
      (item.external_id && item.external_id === player.external_id) || item.name === player.name);
    const data = { ...player, source, last_updated: timestamp };
    if (record) {
      await client.collection('players').update(record.id, data);
      activeIds.add(record.id);
      results.updated++;
    } else {
      const created = await client.collection('players').create(data);
      activeIds.add(created.id);
      results.created++;
    }
  }
  // Only retire old ranks after every incoming row has been saved successfully.
  for (const record of tourRecords) {
    if (!activeIds.has(record.id)) {
      await client.collection('players').update(record.id, { ranking: null, source, last_updated: timestamp });
      results.unranked++;
    }
  }
  return results;
}

let refreshPromise;

/** Refresh both tours; a failed feed leaves its existing snapshot available. */
export async function refreshPlayerRankings({ sources = ['atp', 'wta'], dryRun = false, onlyIfStale = false } = {}) {
  if (refreshPromise) throw new Error('Rankings refresh is already running');
  refreshPromise = (async () => {
    const result = { success: true, sources: {}, timestamp: new Date().toISOString(), dryRun };
    for (const source of sources) {
      try {
        if (onlyIfStale) {
          const logs = await pb.collection('scrape_logs').getList(1, 1, {
            filter: pb.filter('source = {:source} && status = "success"', { source: source.toUpperCase() }),
            sort: '-timestamp',
          });
          if (logs.items[0] && Date.now() - Date.parse(logs.items[0].timestamp) < 24 * 60 * 60 * 1000) {
            result.sources[source] = { success: true, skipped: true };
            continue;
          }
        }
        const players = await fetchRankings(source);
        const counts = dryRun ? { created: 0, updated: 0, failed: 0 } : await syncPlayerData(players, source);
        if (!dryRun) await pb.collection('scrape_logs').create({
          source: source.toUpperCase(), status: 'success', timestamp: new Date().toISOString(),
          playersCount: players.length, syncResult: JSON.stringify(counts),
          source_url: players[0].source_url, ranking_date: players[0].ranking_date,
        });
        result.sources[source] = { success: true, count: players.length, ...counts };
        logger.info(`Rankings refreshed: ${source}, ${players.length} players`);
      } catch (error) {
        result.success = false;
        result.sources[source] = { success: false, error: error.message };
        logger.error(`Rankings refresh failed (${source}): ${error.message}`);
        if (!dryRun) {
          try {
            await pb.collection('scrape_logs').create({ source: source.toUpperCase(), status: 'failed',
              timestamp: new Date().toISOString(), error: error.message });
          } catch (logError) {
            logger.error(`Failed to record rankings failure: ${logError.message}`);
          }
        }
      }
    }
    result.message = result.success ? 'Rankings refreshed successfully' : 'One or more ranking sources failed';
    return result;
  })();
  try { return await refreshPromise; } finally { refreshPromise = null; }
}
