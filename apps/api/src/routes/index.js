import { Router } from 'express';
import healthCheck from './health-check.js';
import scrapeRouter from './scrape.js';
import integratedAiRouter from './integrated-ai.js';
import { scrapeRateLimiter } from '../middleware/rateLimiter.js';

export default function routes() {
  const router = Router();
  router.get('/health', healthCheck);
  router.use('/scrape', scrapeRateLimiter, scrapeRouter);
  router.use('/integrated-ai', integratedAiRouter);
  return router;
}
