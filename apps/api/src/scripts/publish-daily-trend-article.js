import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
	path: fileURLToPath(new URL('../../.env', import.meta.url)),
});

if (process.env.TREND_ARTICLE_ENV_FILE) {
	dotenv.config({
		path: process.env.TREND_ARTICLE_ENV_FILE,
		override: false,
	});
}

const PUBLISH_ENVIRONMENT = [
	'WEBSITE_DOMAIN',
	'PB_SUPERUSER_EMAIL',
	'PB_SUPERUSER_PASSWORD',
];

const hasAiProvider = () => Boolean(
	process.env.OPENAI_API_KEY?.trim() || process.env.DEEPSEEK_API_KEY?.trim(),
);

const hasFlag = (name) => process.argv.includes(name);

async function main() {
	const force = hasFlag('--force');
	const dryRun = hasFlag('--dry-run');
	const requiredEnvironment = dryRun ? [] : PUBLISH_ENVIRONMENT;
	const missingEnvironment = requiredEnvironment.filter(name => !process.env[name]?.trim());
	if (!hasAiProvider()) missingEnvironment.push('OPENAI_API_KEY or DEEPSEEK_API_KEY');

	if (missingEnvironment.length > 0) {
		const error = new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
		error.code = 'MISSING_ENVIRONMENT';
		error.missingEnvironment = missingEnvironment;
		throw error;
	}

	const { prepareDailyTrendArticleDraft, publishDailyTrendArticle } = await import('../utils/dailyTrendArticle.js');

	if (dryRun) {
		const draft = await prepareDailyTrendArticleDraft();
		console.log(JSON.stringify({
			ok: true,
			dryRun: true,
			trendDate: draft.trendDate,
			sourceUrl: draft.sourceUrl,
			trends: (draft.selectedTrends || []).map(trend => trend.title),
			article: {
				title: draft.article.title,
				player_name: draft.article.player_name,
				tags: draft.article.tags,
				meta_description: draft.article.meta_description,
				content: draft.article.content,
			},
			translations: draft.translations,
		}, null, 2));
		return;
	}

	const result = await publishDailyTrendArticle({ force });

	if (result.skipped) {
		console.log(JSON.stringify({
			ok: true,
			skipped: true,
			reason: result.reason,
			articleId: result.article?.id,
			title: result.article?.title,
		}, null, 2));
		return;
	}

	console.log(JSON.stringify({
		ok: true,
		skipped: false,
		articleId: result.article?.id,
		title: result.article?.title,
		trendDate: result.trendDate,
		sourceUrl: result.sourceUrl,
		trends: (result.trends || []).map(trend => trend.title),
		languages: result.article?.translation_languages || [],
	}, null, 2));
}

main().catch((error) => {
	console.error(JSON.stringify({
		ok: false,
		code: error.code,
		error: error.message,
		...(error.missingEnvironment ? { missingEnvironment: error.missingEnvironment } : {}),
	}, null, 2));
	process.exitCode = 1;
});
