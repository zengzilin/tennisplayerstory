import { Router } from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

let pool;
let initPromise;

const MYSQL_CONFIG = {
	host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
	port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
	user: process.env.MYSQL_USER || process.env.DB_USER,
	password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
	database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
	namedPlaceholders: true,
};

const JWT_SECRET = process.env.JWT_SECRET || process.env.PB_ENCRYPTION_KEY || process.env.PB_SUPERUSER_PASSWORD || 'tennishub-local-secret';

const collectionIds = {
	users: 'users',
	articles: 'articles',
	players: 'players',
	vlogs: 'vlogs',
	vlogLikes: 'vlogLikes',
	vlogSaves: 'vlogSaves',
	vlogComments: 'vlogComments',
	scrape_logs: 'scrape_logs',
	_integratedAiMessages: '_integratedAiMessages',
	_integratedAiImages: '_integratedAiImages',
};

const now = () => new Date().toISOString();

const makeId = () => crypto.randomBytes(8).toString('hex').slice(0, 15);

const toPublicRecord = (collection, row) => {
	const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
	return {
		...data,
		id: row.id,
		collectionId: collectionIds[collection] || collection,
		collectionName: collection,
		created: row.created instanceof Date ? row.created.toISOString() : row.created,
		updated: row.updated instanceof Date ? row.updated.toISOString() : row.updated,
	};
};

const getPool = () => {
	if (!pool) {
		if (!MYSQL_CONFIG.user || !MYSQL_CONFIG.database) {
			throw new Error('MySQL is not configured. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.');
		}
		pool = mysql.createPool(MYSQL_CONFIG);
	}
	return pool;
};

const saveRecord = async (collection, id, data, existingCreated) => {
	const created = existingCreated || now();
	const updated = now();
	const createdDate = existingCreated ? new Date(existingCreated) : new Date();
	const updatedDate = new Date();
	const publicData = {
		...data,
		id,
		created: data.created || created,
		updated,
	};

	await getPool().execute(
		`INSERT INTO pb_records (collection_name, record_id, data, created, updated)
		 VALUES (?, ?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE data = VALUES(data), updated = VALUES(updated)`,
		[collection, id, JSON.stringify(publicData), createdDate, updatedDate],
	);

	return {
		id,
		collection_name: collection,
		data: publicData,
		created,
		updated,
	};
};

const initDb = async () => {
	if (!initPromise) {
		initPromise = (async () => {
			await getPool().execute(`
				CREATE TABLE IF NOT EXISTS pb_records (
					collection_name VARCHAR(80) NOT NULL,
					record_id VARCHAR(40) NOT NULL,
					data JSON NOT NULL,
					created DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
					updated DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
					PRIMARY KEY (collection_name, record_id),
					INDEX idx_collection_created (collection_name, created),
					INDEX idx_collection_updated (collection_name, updated)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
			`);

			if (process.env.PB_SUPERUSER_EMAIL && process.env.PB_SUPERUSER_PASSWORD) {
				const [existingRows] = await getPool().execute(
					'SELECT record_id FROM pb_records WHERE collection_name = ? AND JSON_UNQUOTE(JSON_EXTRACT(data, "$.email")) = ? LIMIT 1',
					['users', process.env.PB_SUPERUSER_EMAIL],
				);
				const existing = existingRows[0];
				if (!existing) {
					const id = makeId();
					await saveRecord('users', id, {
						email: process.env.PB_SUPERUSER_EMAIL,
						password: await bcrypt.hash(process.env.PB_SUPERUSER_PASSWORD, 12),
						name: process.env.PB_SUPERUSER_EMAIL.split('@')[0],
						role: 'admin',
						favorite_players: [],
						verified: true,
					});
				}
			}
		})();
	}
	return initPromise;
};

const loadCollection = async (collection) => {
	await initDb();
	const [rows] = await getPool().execute(
		'SELECT collection_name, record_id AS id, data, created, updated FROM pb_records WHERE collection_name = ?',
		[collection],
	);
	return rows.map(row => toPublicRecord(collection, row));
};

const loadRecord = async (collection, id) => {
	await initDb();
	const [rows] = await getPool().execute(
		'SELECT collection_name, record_id AS id, data, created, updated FROM pb_records WHERE collection_name = ? AND record_id = ? LIMIT 1',
		[collection, id],
	);
	return rows[0] ? toPublicRecord(collection, rows[0]) : null;
};

const findOne = async (collection, predicate) => {
	const records = await loadCollection(collection);
	return records.find(predicate) || null;
};

const stripPrivateFields = (record) => {
	if (!record) return record;
	const { password, ...safeRecord } = record;
	return safeRecord;
};

const getAuthUser = (req) => {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : '';
	if (!token) return null;
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch {
		return null;
	}
};

const createToken = (record) => jwt.sign({
	id: record.id,
	recordId: record.id,
	collectionId: collectionIds.users,
	collectionName: 'users',
	type: 'authRecord',
}, JWT_SECRET, { expiresIn: '30d' });

const getField = (record, field) => {
	if (field.endsWith('.id')) {
		return record[field.slice(0, -3)];
	}
	return record[field];
};

const parseValue = (raw) => raw
	?.trim()
	.replace(/^["']|["']$/g, '')
	.replace(/\\"/g, '"');

const matchesCondition = (record, condition) => {
	const cleaned = condition.trim().replace(/^\(|\)$/g, '').trim();
	const contains = cleaned.match(/^([\w.]+)\s*~\s*["'](.+)["']$/);
	if (contains) {
		const value = String(getField(record, contains[1]) ?? '').toLowerCase();
		return value.includes(contains[2].toLowerCase());
	}

	const comparison = cleaned.match(/^([\w.]+)\s*(=|!=|>=|<=|>|<)\s*(.+)$/);
	if (!comparison) return true;

	const [, field, operator, rawValue] = comparison;
	const actual = getField(record, field);
	const expected = parseValue(rawValue);

	if (operator === '=') return String(actual ?? '').toLowerCase() === String(expected ?? '').toLowerCase();
	if (operator === '!=') return String(actual ?? '') !== String(expected ?? '');

	const actualNumber = Number(actual);
	const expectedNumber = Number(expected);
	const actualComparable = Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) ? actualNumber : String(actual ?? '');
	const expectedComparable = Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) ? expectedNumber : String(expected ?? '');

	if (operator === '>=') return actualComparable >= expectedComparable;
	if (operator === '<=') return actualComparable <= expectedComparable;
	if (operator === '>') return actualComparable > expectedComparable;
	if (operator === '<') return actualComparable < expectedComparable;
	return true;
};

const matchesFilter = (record, filter = '') => {
	if (!filter) return true;

	return filter.split(/\s*\|\|\s*/).some(orPart => (
		orPart
			.replace(/^\((.*)\)$/g, '$1')
			.split(/\s*&&\s*/)
			.every(andPart => matchesCondition(record, andPart))
	));
};

const sortRecords = (records, sort = '') => {
	if (!sort) return records;
	const fields = sort.split(',').map(item => item.trim()).filter(Boolean);
	return [...records].sort((a, b) => {
		for (const rawField of fields) {
			const desc = rawField.startsWith('-');
			const field = desc ? rawField.slice(1) : rawField;
			const left = getField(a, field);
			const right = getField(b, field);
			if (left === right) continue;
			const direction = desc ? -1 : 1;
			return left > right ? direction : -direction;
		}
		return 0;
	});
};

const expandRecords = async (records, expand = '') => {
	if (!expand) return records;
	const expandFields = expand.split(',').map(field => field.trim()).filter(Boolean);
	return Promise.all(records.map(async record => {
		const expanded = {};
		for (const field of expandFields) {
			if ((field === 'author' || field === 'user' || field === 'uploader') && record[field]) {
				expanded[field] = stripPrivateFields(await loadRecord('users', record[field]));
			}
		}
		return Object.keys(expanded).length ? { ...record, expand: expanded } : record;
	}));
};

router.use(async (req, res, next) => {
	try {
		await initDb();
		next();
	} catch (error) {
		next(error);
	}
});

router.get('/api/health', (req, res) => {
	res.json({ code: 200, message: 'MySQL platform is healthy.' });
});

const handlePasswordAuth = async (req, res) => {
	const identity = req.body.identity || req.body.email;
	const password = req.body.password;
	const user = await findOne('users', record => record.email === identity || record.username === identity);

	if (!user?.password || !await bcrypt.compare(password, user.password)) {
		return res.status(400).json({ code: 400, message: 'Failed to authenticate.' });
	}

	res.json({ token: createToken(user), record: stripPrivateFields(user) });
};

router.post('/api/collections/users/auth-with-password', handlePasswordAuth);
router.post('/api/collections/_superusers/auth-with-password', handlePasswordAuth);

router.post('/api/collections/users/request-password-reset', (req, res) => {
	res.json({});
});

router.post('/api/collections/users/confirm-password-reset', (req, res) => {
	res.json({});
});

router.get('/api/collections/:collection/records', async (req, res) => {
	const { collection } = req.params;
	const page = Math.max(Number(req.query.page || 1), 1);
	const perPage = Math.max(Number(req.query.perPage || req.query.pageSize || 30), 1);

	let records = await loadCollection(collection);
	records = records.filter(record => matchesFilter(record, req.query.filter || ''));
	records = sortRecords(records, req.query.sort || '');
	records = await expandRecords(records, req.query.expand || '');

	const totalItems = records.length;
	const items = records.slice((page - 1) * perPage, page * perPage).map(stripPrivateFields);

	res.json({
		page,
		perPage,
		totalItems,
		totalPages: Math.max(Math.ceil(totalItems / perPage), 1),
		items,
	});
});

router.get('/api/collections/:collection/records/:id', async (req, res) => {
	const record = await loadRecord(req.params.collection, req.params.id);
	if (!record) return res.status(404).json({ code: 404, message: 'Record not found.' });
	const [expanded] = await expandRecords([record], req.query.expand || '');
	res.json(stripPrivateFields(expanded));
});

router.post('/api/collections/:collection/records', async (req, res) => {
	const { collection } = req.params;
	const data = { ...req.body };
	const authUser = getAuthUser(req);

	if (collection === 'users') {
		if (data.password) {
			data.password = await bcrypt.hash(data.password, 12);
		}
		data.role = data.role || 'user';
		data.verified = data.verified ?? true;
	}

	if (collection === 'articles') {
		data.author = data.author || authUser?.id;
	}

	const id = data.id || makeId();
	const row = await saveRecord(collection, id, data);
	res.status(201).json(stripPrivateFields(toPublicRecord(collection, row)));
});

router.patch('/api/collections/:collection/records/:id', async (req, res) => {
	const existing = await loadRecord(req.params.collection, req.params.id);
	if (!existing) return res.status(404).json({ code: 404, message: 'Record not found.' });

	const data = { ...existing, ...req.body };
	delete data.collectionId;
	delete data.collectionName;
	delete data.expand;

	if (req.params.collection === 'users' && req.body.password) {
		data.password = await bcrypt.hash(req.body.password, 12);
	}

	const row = await saveRecord(req.params.collection, req.params.id, data, existing.created);
	res.json(stripPrivateFields(toPublicRecord(req.params.collection, row)));
});

router.delete('/api/collections/:collection/records/:id', async (req, res) => {
	await initDb();
	await getPool().execute(
		'DELETE FROM pb_records WHERE collection_name = ? AND record_id = ?',
		[req.params.collection, req.params.id],
	);
	res.status(204).end();
});

router.get('/api/files/:collection/:recordId/:filename', (req, res) => {
	res.status(404).end();
});

export default router;
