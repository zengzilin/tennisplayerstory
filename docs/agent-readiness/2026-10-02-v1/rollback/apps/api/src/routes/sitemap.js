import mysql from 'mysql2/promise';

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

const languages = ['en', 'zh', 'ja', 'es', 'fr'];
const staticRoutes = [
	{ path: '', changefreq: 'daily', priority: '1.0' },
	{ path: '/live-matches', changefreq: 'daily', priority: '0.9' },
	{ path: '/players', changefreq: 'weekly', priority: '0.9' },
	{ path: '/rankings', changefreq: 'daily', priority: '0.9' },
	{ path: '/stories', changefreq: 'daily', priority: '0.8' },
	{ path: '/vlogs', changefreq: 'daily', priority: '0.8' },
	{ path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
	{ path: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
	{ path: '/sitemap', changefreq: 'monthly', priority: '0.4' },
];

const escapeXml = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&apos;');

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

const toDate = (value) => {
	if (!value) return new Date().toISOString().slice(0, 10);
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const loadRecords = async (collection, predicate) => {
	const db = getPool();
	if (!db) return [];

	try {
		const [rows] = await db.execute(
			'SELECT data, updated FROM pb_records WHERE collection_name = ?',
			[collection],
		);

		return rows
			.map(row => {
				const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
				return { ...data, updated: data.updated || row.updated };
			})
			.filter(predicate);
	} catch {
		return [];
	}
};

const urlEntry = ({ loc, lastmod, changefreq, priority }) => [
	'  <url>',
	`    <loc>${escapeXml(loc)}</loc>`,
	`    <lastmod>${escapeXml(lastmod)}</lastmod>`,
	`    <changefreq>${escapeXml(changefreq)}</changefreq>`,
	`    <priority>${escapeXml(priority)}</priority>`,
	'  </url>',
].join('\n');

export const sitemapXml = async (req, res) => {
	const baseUrl = getBaseUrl();
	const today = new Date().toISOString().slice(0, 10);
	const urls = [];

	for (const lang of languages) {
		for (const route of staticRoutes) {
			urls.push({
				loc: `${baseUrl}/${lang}${route.path}`,
				lastmod: today,
				changefreq: route.changefreq,
				priority: route.priority,
			});
		}
	}

	const [vlogs, players] = await Promise.all([
		loadRecords('vlogs', item => ['published', 'approved'].includes(item.status)),
		loadRecords('players', item => item.id),
	]);

	for (const lang of languages) {
		for (const vlog of vlogs) {
			urls.push({
				loc: `${baseUrl}/${lang}/vlog/${vlog.id}`,
				lastmod: toDate(vlog.updated),
				changefreq: 'monthly',
				priority: '0.6',
			});
		}

		for (const player of players) {
			urls.push({
				loc: `${baseUrl}/${lang}/players/${player.id}`,
				lastmod: toDate(player.updated),
				changefreq: 'weekly',
				priority: '0.7',
			});
		}
	}

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls.map(urlEntry),
		'</urlset>',
	].join('\n');

	res.type('application/xml').send(xml);
};

export const robotsTxt = (req, res) => {
	const baseUrl = getBaseUrl();

	res.type('text/plain').send([
		'User-agent: *',
		'Allow: /',
		`Sitemap: ${baseUrl}/sitemap.xml`,
		'',
	].join('\n'));
};
