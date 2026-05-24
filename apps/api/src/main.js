import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/index.js';
import logger from './utils/logger.js';
import { initializeScheduler } from './utils/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

app.use(helmet({
	contentSecurityPolicy: false, // Disabled to allow React frontend assets to load properly
}));
app.use(cors({
	origin: process.env.CORS_ORIGIN || '*',
	credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/hcgi/api', routes());

// Serve React static files from the root build output, with a local legacy fallback.
const staticPath = fs.existsSync(path.join(__dirname, '../../../dist/apps/web'))
	? path.join(__dirname, '../../../dist/apps/web')
	: path.join(__dirname, '../../web/dist');
app.use(express.static(staticPath));

// Catch-all middleware for client-side routing
// Serves index.html for all non-API routes to enable client-side routing
app.use((req, res, next) => {
	// Don't serve index.html for API routes that weren't found
	if (req.path.startsWith('/hcgi/api')) {
		return next();
	}
	res.sendFile(path.join(staticPath, 'index.html'));
});

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
	// Initialize scheduler for automated scraping
	initializeScheduler();
});

export default app;
