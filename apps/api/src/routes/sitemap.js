import mysql from 'mysql2/promise';
import { renderSitemapXml } from '../../../../shared/sitemap.mjs';
import logger from '../utils/logger.js';

let pool;

const MYSQL_CONFIG = {
	host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
	port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
	user: process.env.MYSQL_USER || process.env.DB_USER,
	password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
	database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
};

const getBaseUrl = () => {
	const domain = process.env.WEBSITE_DOMAIN || 'tennisplayerstory.com';
	return domain.startsWith('http') ? domain.replace(/\/$/, '') : `https://${domain}`;
};

const getPool = () => {
	if (!pool && MYSQL_CONFIG.user && MYSQL_CONFIG.database) {
		pool = mysql.createPool(MYSQL_CONFIG);
	}
	return pool;
};

const loadRecords = async (collection, predicate) => {
	const db = getPool();
	if (!db) return [];

	try {
		const [rows] = await db.execute(
			'SELECT record_id AS id, data, updated FROM pb_records WHERE collection_name = ?',
			[collection],
		);

		return rows
			.map(row => {
				const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
				return { ...data, id: row.id, updated: data.updated || row.updated };
			})
			.filter(predicate);
	} catch (error) {
		logger.error(`Sitemap records unavailable: ${error.message}`);
		throw error;
	}
};

export const sitemapXml = async (req, res) => {
	try {
		const [articles, vlogs] = await Promise.all([
			loadRecords('articles', item => item.status === 'approved'),
			loadRecords('vlogs', item => ['published', 'approved'].includes(item.status)),
		]);
		res.set('Cache-Control', 'no-cache');
		res.type('application/xml').send(renderSitemapXml({ baseUrl: getBaseUrl(), articles, vlogs }));
	} catch {
		res.set('Retry-After', '60');
		res.status(503).type('text/plain').send('Sitemap temporarily unavailable. Please retry later.');
	}
};

export const robotsTxt = (req, res) => {
	const baseUrl = getBaseUrl();

	res.type('text/plain').send([
		'User-agent: *',
		'Allow: /',
		'Content-Signal: search=yes, ai-input=yes, ai-train=no',
		'Agentmap: ' + baseUrl + '/.well-known/ai-catalog.json',
		`Sitemap: ${baseUrl}/sitemap.xml`,
		'',
	].join('\n'));
};
