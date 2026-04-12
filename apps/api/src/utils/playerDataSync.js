import 'dotenv/config';
import pb from './pocketbaseClient.js';
import logger from './logger.js';

/**
 * Sync scraped player data to PocketBase 'players' collection
 * @param {Array} players - Array of player objects with name, ranking, country, points, profileUrl, source, age
 * @param {string} source - Source identifier (ATP, WTA, ITF)
 * @returns {Object} Sync results { created: number, updated: number, failed: number }
 */
export async function syncPlayerData(players, source) {
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
  };

  if (!Array.isArray(players) || players.length === 0) {
    logger.warn(`syncPlayerData called with invalid players array for source ${source}`);
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
      logger.error(`Failed to sync player ${player.name} from ${source}:`, error.message);
      results.failed++;
    }
  }

  logger.info(`Sync completed for ${source}: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);
  return results;
}
