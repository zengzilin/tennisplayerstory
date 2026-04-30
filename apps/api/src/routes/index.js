import { Router } from 'express';
import healthCheck from './health-check.js';
import scrapeRouter from './scrape.js';
import integratedAiRouter from './integrated-ai.js';
import { scrapeRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/scrape', scrapeRateLimiter, scrapeRouter);
    router.use('/integrated-ai', integratedAiRouter);

    return router;
};