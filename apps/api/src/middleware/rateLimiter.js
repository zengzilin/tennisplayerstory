import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for scraping endpoints
 * Limit: 5 requests per hour per IP
 */
export const scrapeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per windowMs
  message: 'Too many scraping requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and status endpoints
    return req.path === '/scrape/status';
  },
});