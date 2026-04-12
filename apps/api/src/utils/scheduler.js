import 'dotenv/config';
import cron from 'node-cron';
import logger from './logger.js';
import pb from './pocketbaseClient.js';

/**
 * Initialize scheduled scraping tasks
 */
export function initializeScheduler() {
  // Schedule daily scraping at 2 AM UTC
  const task = cron.schedule('0 2 * * *', async () => {
    logger.info('Starting scheduled scraping task');
    const startTime = new Date();

    try {
      const response = await fetch('http://localhost:3001/scrape/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Scraping failed with status ${response.status}`);
      }

      const result = await response.json();
      const endTime = new Date();
      const duration = endTime - startTime;

      // Log successful scrape
      await pb.collection('scrape_logs').create({
        source: 'SCHEDULED',
        status: 'success',
        message: result.message,
        duration: duration,
        timestamp: new Date().toISOString(),
      }).catch(err => logger.error('Failed to log scheduled scrape:', err));

      logger.info(`Scheduled scraping completed in ${duration}ms`, result);
    } catch (error) {
      logger.error('Scheduled scraping failed:', error);

      // Log failed scrape
      await pb.collection('scrape_logs').create({
        source: 'SCHEDULED',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      }).catch(err => logger.error('Failed to log scheduled scrape error:', err));
    }
  });

  logger.info('Scheduler initialized - daily scraping at 2 AM UTC');
  return task;
}
