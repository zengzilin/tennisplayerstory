import { Router } from 'express';
import { prepareDailyTrendArticleDraft, publishDailyTrendArticle } from '../utils/dailyTrendArticle.js';

const router = Router();

const isAuthorized = (req) => {
	const configuredSecret = process.env.CRON_SECRET || process.env.TREND_ARTICLE_SECRET;
	if (!configuredSecret) return process.env.NODE_ENV !== 'production';

	const headerSecret = req.headers['x-cron-secret'];
	const bearerToken = req.headers.authorization?.startsWith('Bearer ')
		? req.headers.authorization.slice(7)
		: '';

	return headerSecret === configuredSecret || bearerToken === configuredSecret;
};

router.post('/daily', async (req, res, next) => {
	try {
		if (!isAuthorized(req)) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const dryRun = req.query.dryRun === 'true' || req.body?.dryRun === true;
		if (dryRun) {
			const draft = await prepareDailyTrendArticleDraft();
			return res.json({
				ok: true,
				dryRun: true,
				trendDate: draft.trendDate,
				sourceUrl: draft.sourceUrl,
				trends: (draft.selectedTrends || []).map(trend => trend.title),
				article: draft.article,
				translations: draft.translations,
			});
		}

		const force = req.query.force === 'true' || req.body?.force === true;
		const result = await publishDailyTrendArticle({ force });

		return res.json({
			ok: true,
			...result,
		});
	} catch (error) {
		return next(error);
	}
});

export default router;
