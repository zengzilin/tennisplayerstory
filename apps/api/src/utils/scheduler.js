import 'dotenv/config';
import cron from 'node-cron';
import logger from './logger.js';
import { refreshPlayerRankings } from './playerDataSync.js';
import { publishDailyTrendArticle } from './dailyTrendArticle.js';
import { publishDailyYoutubeArticle } from './dailyYoutubeArticle.js';
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

const runYoutubeArticleTask = async (trigger) => {
  logger.info(`Starting YouTube trending article task (${trigger})`);

  try {
    const result = await publishDailyYoutubeArticle();
    if (result.skipped) {
      logger.info(`YouTube trending article task skipped (${trigger}): ${result.reason}`);
      return result;
    }

    logger.info(`YouTube trending article published (${trigger})`, {
      id: result.article?.id,
      title: result.article?.title,
      trendDate: result.trendDate,
    });
    return result;
  } catch (error) {
    logger.error(`YouTube trending article task failed (${trigger}):`, error);
    return null;
  }
};

/**
 * Initialize scheduled scraping tasks
 */
export function initializeScheduler() {
  const runRankingsTask = async (onlyIfStale = false) => {
    try {
      await refreshPlayerRankings({ onlyIfStale });
    } catch (error) {
      logger.error('Scheduled rankings refresh failed:', error);
    }
  };
  const scrapingTask = cron.schedule('0 2 * * *', () => runRankingsTask(), { timezone: 'UTC' });
  // Catch missed runs after host restarts; recent successful snapshots are skipped.
  const rankingsStartupTimer = setTimeout(() => runRankingsTask(true), 5000);

  const trendArticleCron = process.env.TREND_ARTICLE_CRON || '30 9 * * *';
  const trendArticleTimezone = process.env.TREND_ARTICLE_TIMEZONE || 'Asia/Shanghai';
  const trendArticleTask = cron.schedule(trendArticleCron, () => runTrendArticleTask('scheduled cron'), {
    timezone: trendArticleTimezone,
  });

  const youtubeArticleCron = process.env.YOUTUBE_ARTICLE_CRON || '0 10 * * *';
  const youtubeArticleTimezone = process.env.YOUTUBE_ARTICLE_TIMEZONE || trendArticleTimezone;
  const youtubeArticleTask = cron.schedule(youtubeArticleCron, () => runYoutubeArticleTask('scheduled cron'), {
    timezone: youtubeArticleTimezone,
  });

  const startupCatchupEnabled = process.env.TREND_ARTICLE_STARTUP_CATCHUP !== 'false';
  const configuredStartupDelay = Number(process.env.TREND_ARTICLE_STARTUP_CATCHUP_DELAY_MS || 1000);
  const startupCatchupDelayMs = Number.isFinite(configuredStartupDelay)
    ? Math.max(configuredStartupDelay, 0)
    : 1000;
  let startupCatchupTimer = null;
  let youtubeStartupCatchupTimer = null;

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

  const youtubeStartupCatchupEnabled = process.env.YOUTUBE_ARTICLE_STARTUP_CATCHUP !== 'false';
  const configuredYoutubeStartupDelay = Number(
    process.env.YOUTUBE_ARTICLE_STARTUP_CATCHUP_DELAY_MS || startupCatchupDelayMs,
  );
  const youtubeStartupCatchupDelayMs = Number.isFinite(configuredYoutubeStartupDelay)
    ? Math.max(configuredYoutubeStartupDelay, 0)
    : startupCatchupDelayMs;

  if (youtubeStartupCatchupEnabled) {
    if (!parseDailyCronTime(youtubeArticleCron)) {
      logger.warn(`YouTube startup catch-up requires a fixed daily cron expression; received "${youtubeArticleCron}"`);
    } else if (shouldRunStartupCatchup({
      cronExpression: youtubeArticleCron,
      timeZone: youtubeArticleTimezone,
    })) {
      logger.info(`Scheduling startup catch-up for YouTube trending article in ${youtubeStartupCatchupDelayMs}ms`);
      youtubeStartupCatchupTimer = setTimeout(() => {
        void runYoutubeArticleTask('startup catch-up');
      }, youtubeStartupCatchupDelayMs);
    }
  }

  logger.info(`Scheduler initialized - daily scraping at 2 AM UTC; Google Trends article at "${trendArticleCron}" (${trendArticleTimezone}); YouTube trending article at "${youtubeArticleCron}" (${youtubeArticleTimezone})`);
  return {
    scrapingTask,
    rankingsStartupTimer,
    trendArticleTask,
    startupCatchupTimer,
    youtubeArticleTask,
    youtubeStartupCatchupTimer,
  };
}
