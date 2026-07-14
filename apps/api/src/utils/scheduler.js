import 'dotenv/config';
import cron from 'node-cron';
import logger from './logger.js';
import pb from './pocketbaseClient.js';
import { publishDailyTrendArticle } from './dailyTrendArticle.js';
import { parseDailyCronTime, shouldRunStartupCatchup } from './trendArticleSchedule.js';

const runTrendArticleTask = async (trigger) => {
  logger.info(`Starting Google Trends article task (${trigger})`);

  try {
    const result = await publishDailyTrendArticle();
    if (result.skipped) {
      logger.info(`Google Trends article task skipped (${trigger}): ${result.reason}`);
      return result;
    }

    logger.info(`Google Trends article published (${trigger})`, {
      id: result.article?.id,
      title: result.article?.title,
      trendDate: result.trendDate,
    });
    return result;
  } catch (error) {
    logger.error(`Google Trends article task failed (${trigger}):`, error);
    return null;
  }
};

/**
 * Initialize scheduled scraping tasks
 */
export function initializeScheduler() {
  // Schedule daily scraping at 2 AM UTC
  const scrapingTask = cron.schedule('0 2 * * *', async () => {
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

  const trendArticleCron = process.env.TREND_ARTICLE_CRON || '30 9 * * *';
  const trendArticleTimezone = process.env.TREND_ARTICLE_TIMEZONE || 'Asia/Shanghai';
  const trendArticleTask = cron.schedule(trendArticleCron, () => runTrendArticleTask('scheduled cron'), {
    timezone: trendArticleTimezone,
  });

  const startupCatchupEnabled = process.env.TREND_ARTICLE_STARTUP_CATCHUP !== 'false';
  const configuredStartupDelay = Number(process.env.TREND_ARTICLE_STARTUP_CATCHUP_DELAY_MS || 1000);
  const startupCatchupDelayMs = Number.isFinite(configuredStartupDelay)
    ? Math.max(configuredStartupDelay, 0)
    : 1000;
  let startupCatchupTimer = null;

  if (startupCatchupEnabled) {
    if (!parseDailyCronTime(trendArticleCron)) {
      logger.warn(`Startup catch-up requires a fixed daily cron expression; received "${trendArticleCron}"`);
    } else if (shouldRunStartupCatchup({
      cronExpression: trendArticleCron,
      timeZone: trendArticleTimezone,
    })) {
      logger.info(`Scheduling startup catch-up for Google Trends article in ${startupCatchupDelayMs}ms`);
      startupCatchupTimer = setTimeout(() => {
        void runTrendArticleTask('startup catch-up');
      }, startupCatchupDelayMs);
    }
  }

  logger.info(`Scheduler initialized - daily scraping at 2 AM UTC; Google Trends article at "${trendArticleCron}" (${trendArticleTimezone}); startup catch-up ${startupCatchupEnabled ? 'enabled' : 'disabled'}`);
  return {
    scrapingTask,
    trendArticleTask,
    startupCatchupTimer,
  };
}
