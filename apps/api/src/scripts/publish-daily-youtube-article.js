import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
	path: fileURLToPath(new URL('../../.env', import.meta.url)),
});

const articleEnvironmentFile = process.env.YOUTUBE_ARTICLE_ENV_FILE || process.env.TREND_ARTICLE_ENV_FILE;
if (articleEnvironmentFile) {
	dotenv.config({
		path: articleEnvironmentFile,
		override: false,
	});
}

const PUBLISH_ENVIRONMENT = [
	'WEBSITE_DOMAIN',
	'PB_SUPERUSER_EMAIL',
	'PB_SUPERUSER_PASSWORD',
	'YOUTUBE_API_KEY',
];

const hasAiProvider = () => Boolean(
	process.env.OPENAI_API_KEY?.trim() || process.env.DEEPSEEK_API_KEY?.trim(),
);

const hasFlag = name => process.argv.includes(name);

async function main() {
	const force = hasFlag('--force');
	const dryRun = hasFlag('--dry-run');
	const requiredEnvironment = dryRun ? ['YOUTUBE_API_KEY'] : PUBLISH_ENVIRONMENT;
	const missingEnvironment = requiredEnvironment.filter(name => !process.env[name]?.trim());
	if (!hasAiProvider()) missingEnvironment.push('OPENAI_API_KEY or DEEPSEEK_API_KEY');

	if (missingEnvironment.length > 0) {
		const error = new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
		error.code = 'MISSING_ENVIRONMENT';
		error.missingEnvironment = missingEnvironment;
		throw error;
	}

	const {
		prepareDailyYoutubeArticleDraft,
		publishDailyYoutubeArticle,
	} = await import('../utils/dailyYoutubeArticle.js');

	if (dryRun) {
		const draft = await prepareDailyYoutubeArticleDraft();
		console.log(JSON.stringify({
			ok: true,
			dryRun: true,
			trendDate: draft.trendDate,
			sourceUrl: draft.sourceUrl,
			keywords: draft.matchedKeywords,
			videos: draft.selectedVideos.map(video => ({
				title: video.title,
				sourceUrl: video.sourceUrl,
			})),
			article: draft.article,
			translations: draft.translations,
		}, null, 2));
		return;
	}

	const result = await publishDailyYoutubeArticle({ force });
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
		keywords: result.keywords,
		videos: result.videos.map(video => video.title),
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
