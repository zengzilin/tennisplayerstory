import logger from './logger.js';
import pb from './pocketbaseClient.js';
import {
	generateArticleWithTranslations,
	getTrendDate,
	normalizeTags,
	normalizeTranslations,
} from './dailyTrendArticle.js';

const YOUTUBE_VIDEOS_API_URL = 'https://www.googleapis.com/youtube/v3/videos';
const DEFAULT_MAX_RESULTS = 50;
const DEFAULT_TENNIS_KEYWORDS = [
	'tennis',
	'atp',
	'wta',
	'wimbledon',
	'us open',
	'australian open',
	'roland garros',
	'french open',
	'grand slam',
	'novak djokovic',
	'carlos alcaraz',
	'jannik sinner',
	'iga swiatek',
	'coco gauff',
	'aryna sabalenka',
	'naomi osaka',
	'rafael nadal',
	'roger federer',
];

let activeDailyYoutubePublish = null;

class NoYoutubeTennisKeywordsError extends Error {
	constructor(message) {
		super(message);
		this.code = 'NO_YOUTUBE_TENNIS_KEYWORDS';
	}
}

const getConfiguredKeywords = () => {
	const configured = process.env.YOUTUBE_ARTICLE_TENNIS_KEYWORDS;
	if (!configured) return DEFAULT_TENNIS_KEYWORDS;

	return configured
		.split(',')
		.map(keyword => keyword.trim().toLowerCase())
		.filter(Boolean);
};

const getVideoText = (video) => [
	video.title,
	video.description,
	...(video.tags || []),
].join(' ').toLowerCase();

const getMatchingKeywords = (video, keywords) => {
	const videoText = getVideoText(video);
	return keywords.filter(keyword => videoText.includes(keyword));
};

const getMaxResults = () => {
	const configured = Number(process.env.YOUTUBE_TRENDING_MAX_RESULTS || DEFAULT_MAX_RESULTS);
	if (!Number.isFinite(configured)) return DEFAULT_MAX_RESULTS;
	return Math.min(Math.max(Math.floor(configured), 1), 50);
};

const fetchWithTimeout = async (url, options = {}) => {
	const timeoutMs = Number(process.env.YOUTUBE_ARTICLE_FETCH_TIMEOUT_MS || 15000);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
};

const toYoutubeVideo = (item, rank) => {
	const snippet = item?.snippet || {};
	const id = String(item?.id || '').trim();

	return {
		id,
		rank,
		title: String(snippet.title || '').trim(),
		description: String(snippet.description || '').trim(),
		tags: Array.isArray(snippet.tags) ? snippet.tags.map(tag => String(tag).trim()).filter(Boolean) : [],
		channelTitle: String(snippet.channelTitle || '').trim(),
		publishedAt: String(snippet.publishedAt || '').trim(),
		sourceUrl: id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : '',
	};
};

export async function fetchYoutubeTrendingVideos({
	regionCode = process.env.YOUTUBE_TRENDING_REGION || 'US',
	language = process.env.YOUTUBE_TRENDING_LANGUAGE || 'zh-Hans',
} = {}) {
	const apiKey = process.env.YOUTUBE_API_KEY?.trim();
	if (!apiKey) {
		const error = new Error('Missing required environment variable: YOUTUBE_API_KEY');
		error.code = 'MISSING_YOUTUBE_API_KEY';
		throw error;
	}

	const url = new URL(YOUTUBE_VIDEOS_API_URL);
	url.searchParams.set('part', 'snippet');
	url.searchParams.set('chart', 'mostPopular');
	url.searchParams.set('regionCode', regionCode);
	url.searchParams.set('hl', language);
	url.searchParams.set('maxResults', String(getMaxResults()));
	url.searchParams.set('key', apiKey);

	const response = await fetchWithTimeout(url, {
		headers: { Accept: 'application/json' },
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(`YouTube trending videos request failed with ${response.status}: ${data?.error?.message || 'Unknown error'}`);
	}

	const videos = (Array.isArray(data.items) ? data.items : [])
		.map((item, index) => toYoutubeVideo(item, index + 1))
		.filter(video => video.id && video.title);

	if (videos.length === 0) {
		throw new Error('YouTube returned no popular videos');
	}

	return {
		sourceUrl: 'https://www.youtube.com/feed/trending',
		videos,
	};
}

const toYoutubeDigest = (videos, keywords) => videos.map(video => ({
	rank: video.rank,
	video_id: video.id,
	title: video.title,
	description: video.description || null,
	tags: video.tags.slice(0, 20),
	matched_keywords: getMatchingKeywords(video, keywords),
	channel: video.channelTitle || null,
	published_at: video.publishedAt || null,
	source_url: video.sourceUrl,
}));

const buildYoutubeNewsPrompt = ({ selectedVideos, trendDate, sourceUrl, keywords }) => `
你是 TennisHub 的中文网球新闻编辑和 SEO 编辑。请根据 YouTube 当日热门视频中的网球相关关键词和视频元数据，为 https://tennisplayerstory.com/zh/stories 撰写一篇面向中文搜索用户的网球新闻热点文章。文章必须是具体、可追溯的视频热点报道，不能写成泛泛的 YouTube 热门概览、人物小传或心得随笔。

要求：
- 第一段直接写明最相关视频涉及的球员、赛事或网球事件，以及其出现在 YouTube 热门视频中的事实；标题和 meta_description 自然包含核心网球、球员或赛事关键词。
- 使用客观新闻结构：导语、视频标题/描述/标签中可核实的已知信息、相关背景、为何值得网球读者关注。可使用 3-5 个具体小标题。
- 只能使用下方视频元数据明确支持的事实。不得臆造比赛比分、赛果、采访、引语、时间地点、球员行程、观看量、热视频排名、原因或后续预测。
- 不得把“热门”本身作为全部文章内容；应围绕视频数据清楚呈现的网球话题。若数据不足以支持某一细节，必须省略。
- 正文必须不少于 2500 个中文字符，建议控制在 2800-3500 个中文字符；使用 10-12 个内容充实的自然段。补充长度时只能重新组织和解释已提供的来源信息，不能重复观点或添加未经支持的事实。
- tags 包含“网球新闻”“网球热点”“YouTube热门”以及来源支持的球员、赛事或关键词。
- 输出必须是 JSON，不要 Markdown 代码块。

请返回这个 JSON 结构：
{
  "title": "50字以内中文标题",
  "player_name": "主要球员或主题；如果没有单一球员，用 YouTube 网球热门",
  "content": "完整中文文章，分段，用换行分隔",
  "tags": ["网球新闻", "网球热点", "YouTube热门", "..."],
  "meta_description": "120字以内中文SEO摘要"
}

日期：${trendDate}
YouTube 热门页：${sourceUrl}
网球关键词词表：${JSON.stringify(keywords)}
可作为新闻事实依据的 YouTube 视频元数据：
${JSON.stringify(toYoutubeDigest(selectedVideos, keywords), null, 2)}
`;

async function findExistingDailyYoutubeArticle(trendDate) {
	const records = await pb.collection('articles').getList(1, 50, {
		filter: `trend_source="youtube_trending" && trend_date="${trendDate}"`,
		sort: '-created',
		$autoCancel: false,
	});

	return records.items[0] || null;
}

async function logYoutubeArticleRun(data) {
	try {
		await pb.collection('scrape_logs').create({
			source: 'YOUTUBE_TRENDING_ARTICLE',
			status: data.status,
			message: data.message,
			players: data.keywordCount || 0,
			errors: data.error || '',
			syncResult: JSON.stringify(data),
			timestamp: new Date().toISOString(),
		}, { $autoCancel: false });
	} catch (error) {
		logger.warn('Failed to log YouTube trending article run:', error.message);
	}
}

export async function prepareDailyYoutubeArticleDraft({ trendDate = getTrendDate() } = {}) {
	const { videos, sourceUrl } = await fetchYoutubeTrendingVideos();
	const keywords = getConfiguredKeywords();
	const selectedVideos = videos
		.filter(video => getMatchingKeywords(video, keywords).length > 0)
		.slice(0, 5);

	if (selectedVideos.length === 0) {
		throw new NoYoutubeTennisKeywordsError('YouTube returned no tennis-related trending keywords; skipped without publishing.');
	}
	const matchedKeywords = [...new Set(selectedVideos.flatMap(video => getMatchingKeywords(video, keywords)))];

	const { article, translations } = await generateArticleWithTranslations({
		prompt: buildYoutubeNewsPrompt({
			selectedVideos,
			trendDate,
			sourceUrl,
			keywords,
		}),
		fallbackPlayerName: 'YouTube 网球热门',
	});

	return {
		article,
		translations,
		selectedVideos,
		keywords,
		matchedKeywords,
		sourceUrl,
		trendDate,
	};
}

async function executeDailyYoutubeArticlePublish({ force = false } = {}) {
	const trendDate = getTrendDate();

	if (!force) {
		const existing = await findExistingDailyYoutubeArticle(trendDate);
		if (existing) {
			return {
				skipped: true,
				reason: `YouTube trending article already exists for ${trendDate}`,
				article: existing,
			};
		}
	}

	try {
		const draft = await prepareDailyYoutubeArticleDraft({ trendDate });
		const trendTerms = [...new Set([
			...draft.matchedKeywords,
			...draft.selectedVideos.map(video => video.title),
		])].slice(0, 10);
		const article = await pb.collection('articles').create({
			title: draft.article.title,
			player_name: draft.article.player_name,
			content: draft.article.content,
			status: 'approved',
			tags: normalizeTags(['YouTube热门', ...draft.article.tags]),
			meta_description: draft.article.meta_description,
			trend_source: 'youtube_trending',
			trend_date: trendDate,
			trend_terms: trendTerms,
			trend_source_url: draft.selectedVideos[0].sourceUrl || draft.sourceUrl,
			translations: normalizeTranslations(draft.translations),
			translation_languages: Object.keys(draft.translations),
		}, { $autoCancel: false });

		await logYoutubeArticleRun({
			status: 'success',
			message: `Published YouTube trending article for ${trendDate}`,
			articleId: article.id,
			keywordCount: trendTerms.length,
			keywords: trendTerms,
			videos: draft.selectedVideos.map(video => video.title),
			languages: Object.keys(draft.translations),
		});

		return {
			skipped: false,
			article,
			videos: draft.selectedVideos,
			keywords: trendTerms,
			sourceUrl: draft.selectedVideos[0].sourceUrl || draft.sourceUrl,
			trendDate,
		};
	} catch (error) {
		if (error.code === 'NO_YOUTUBE_TENNIS_KEYWORDS') {
			await logYoutubeArticleRun({
				status: 'skipped',
				message: error.message,
				keywordCount: 0,
			});
			return { skipped: true, reason: error.message };
		}

		await logYoutubeArticleRun({
			status: 'failed',
			message: `Failed to publish YouTube trending article for ${trendDate}`,
			error: error.message,
		});
		throw error;
	}
}

export async function publishDailyYoutubeArticle({ force = false } = {}) {
	if (force) return executeDailyYoutubeArticlePublish({ force: true });
	if (activeDailyYoutubePublish) return activeDailyYoutubePublish;

	const publishRun = executeDailyYoutubeArticlePublish();
	activeDailyYoutubePublish = publishRun;

	try {
		return await publishRun;
	} finally {
		if (activeDailyYoutubePublish === publishRun) {
			activeDailyYoutubePublish = null;
		}
	}
}
