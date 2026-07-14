import logger from './logger.js';
import pb from './pocketbaseClient.js';

const GOOGLE_TRENDS_BASE_URLS = [
	'https://trends.google.com/trending/rss',
	'https://trends.google.com/trends/trendingsearches/daily/rss',
];

const GOOGLE_TRENDS_API_URLS = [
	'https://trends.google.com/trends/api/dailytrends',
	'https://trends.google.com/trends/api/realtimetrends',
];

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

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';
const DEFAULT_MIN_ARTICLE_CHARACTERS = 2500;
const DEFAULT_MIN_TRANSLATION_CHARACTERS = 1200;
const DEFAULT_MAX_OUTPUT_TOKENS = 8000;
const DEFAULT_GENERATION_ATTEMPTS = 3;
const ARTICLE_SYSTEM_INSTRUCTIONS = 'You write accurate, SEO-friendly Chinese tennis news articles from provided trend data. Use only supported facts and return only valid JSON.';
const ARTICLE_TRANSLATION_LANGUAGES = [
	{ code: 'en', name: 'English' },
	{ code: 'ja', name: 'Japanese' },
	{ code: 'es', name: 'Spanish' },
	{ code: 'fr', name: 'French' },
	{ code: 'de', name: 'German' },
];
let activeDailyPublish = null;

class NoTennisTrendsError extends Error {
	constructor(message) {
		super(message);
		this.code = 'NO_TENNIS_TRENDS';
	}
}

const fetchWithTimeout = async (url, options = {}) => {
	const timeoutMs = Number(process.env.TREND_ARTICLE_FETCH_TIMEOUT_MS || 15000);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(url, {
			...options,
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeout);
	}
};

const decodeXml = (value = '') => value
	.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
	.replace(/&amp;/g, '&')
	.replace(/&lt;/g, '<')
	.replace(/&gt;/g, '>')
	.replace(/&quot;/g, '"')
	.replace(/&#39;/g, "'")
	.trim();

const stripTags = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const getTag = (xml, tagName) => {
	const match = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
	return match ? decodeXml(stripTags(match[1])) : '';
};

const parseTrendRss = (xml) => {
	if (!xml || !xml.includes('<item')) return [];

	return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)]
		.map((match) => {
			const item = match[0];
			const relatedTitles = [...item.matchAll(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/gi)]
				.map(newsMatch => decodeXml(stripTags(newsMatch[1])))
				.filter(Boolean);

			return {
				title: getTag(item, 'title'),
				description: getTag(item, 'description'),
				link: getTag(item, 'link'),
				pubDate: getTag(item, 'pubDate'),
				traffic: getTag(item, 'ht:approx_traffic'),
				relatedTitles,
			};
		})
		.filter(trend => trend.title);
};

const stripGoogleJsonPrefix = (text) => text.replace(/^\)\]\}',?\s*/, '').trim();

const parseDailyTrendsApi = (data) => {
	const days = data?.default?.trendingSearchesDays || [];
	return days.flatMap(day => (
		(day.trendingSearches || []).map((item) => ({
			title: item.title?.query || '',
			description: item.articles?.[0]?.snippet || '',
			link: item.shareUrl || item.articles?.[0]?.url || '',
			pubDate: day.formattedDate || '',
			traffic: item.formattedTraffic || '',
			relatedTitles: [
				...(item.relatedQueries || []).map(query => query.query),
				...(item.articles || []).map(article => article.title),
			].filter(Boolean),
		}))
	)).filter(trend => trend.title);
};

const parseRealtimeTrendsApi = (data) => {
	const stories = data?.storySummaries?.trendingStories || [];
	return stories.map((story) => ({
		title: story.title || story.entityNames?.[0] || '',
		description: story.articles?.[0]?.snippet || '',
		link: story.shareUrl || story.articles?.[0]?.url || '',
		pubDate: story.articles?.[0]?.time || '',
		traffic: story.formattedTraffic || '',
		relatedTitles: [
			...(story.entityNames || []),
			...(story.articles || []).map(article => article.articleTitle || article.title),
		].filter(Boolean),
	})).filter(trend => trend.title);
};

const parseTrendApi = (text, sourceUrl) => {
	if (!text) return [];

	const data = JSON.parse(stripGoogleJsonPrefix(text));
	if (sourceUrl.includes('/dailytrends')) return parseDailyTrendsApi(data);
	if (sourceUrl.includes('/realtimetrends')) return parseRealtimeTrendsApi(data);
	return [];
};

const getConfiguredKeywords = () => {
	const configured = process.env.TREND_ARTICLE_TENNIS_KEYWORDS;
	if (!configured) return DEFAULT_TENNIS_KEYWORDS;

	return configured
		.split(',')
		.map(keyword => keyword.trim().toLowerCase())
		.filter(Boolean);
};

const isTennisTrend = (trend, keywords) => {
	const haystack = [
		trend.title,
		trend.description,
		...(trend.relatedTitles || []),
	].join(' ').toLowerCase();

	return keywords.some(keyword => haystack.includes(keyword));
};

export async function fetchGoogleTrends({ geo = process.env.GOOGLE_TRENDS_GEO || 'US' } = {}) {
	const headers = {
		'Accept': 'application/rss+xml,text/xml,application/xml,text/plain,*/*',
		'User-Agent': process.env.GOOGLE_TRENDS_USER_AGENT || 'Mozilla/5.0 (compatible; TennisHubBot/1.0; +https://tennisplayerstory.com)',
	};

	const errors = [];

	for (const baseUrl of [
		...(process.env.GOOGLE_TRENDS_RSS_URL ? [process.env.GOOGLE_TRENDS_RSS_URL] : []),
		...GOOGLE_TRENDS_BASE_URLS,
	]) {
		const url = new URL(baseUrl);
		url.searchParams.set('geo', geo);

		try {
			const response = await fetchWithTimeout(url, { headers });
			const body = await response.text();

			if (!response.ok) {
				throw new Error(`Google Trends returned ${response.status}`);
			}

			const trends = parseTrendRss(body);
			if (trends.length > 0) {
				return {
					sourceUrl: url.toString(),
					trends,
				};
			}

			errors.push(`${url.toString()} returned no trend items`);
		} catch (error) {
			errors.push(`${url.toString()}: ${error.message}`);
		}
	}

	for (const baseUrl of [
		...(process.env.GOOGLE_TRENDS_API_URL ? [process.env.GOOGLE_TRENDS_API_URL] : []),
		...GOOGLE_TRENDS_API_URLS,
	]) {
		const url = new URL(baseUrl);
		url.searchParams.set('hl', process.env.GOOGLE_TRENDS_HL || 'en-US');
		url.searchParams.set('tz', process.env.GOOGLE_TRENDS_TZ || '-480');
		url.searchParams.set('geo', geo);

		if (url.pathname.endsWith('/dailytrends')) {
			url.searchParams.set('ns', process.env.GOOGLE_TRENDS_NS || '15');
		}

		if (url.pathname.endsWith('/realtimetrends')) {
			url.searchParams.set('cat', process.env.GOOGLE_TRENDS_CATEGORY || 'all');
			url.searchParams.set('fi', '0');
			url.searchParams.set('fs', '0');
			url.searchParams.set('ri', process.env.GOOGLE_TRENDS_REALTIME_RI || '300');
			url.searchParams.set('rs', process.env.GOOGLE_TRENDS_REALTIME_RS || '20');
			url.searchParams.set('sort', '0');
		}

		try {
			const response = await fetchWithTimeout(url, { headers });
			const body = await response.text();

			if (!response.ok) {
				throw new Error(`Google Trends API returned ${response.status}`);
			}

			const trends = parseTrendApi(body, url.toString());
			if (trends.length > 0) {
				return {
					sourceUrl: url.toString(),
					trends,
				};
			}

			errors.push(`${url.toString()} returned no trend items`);
		} catch (error) {
			errors.push(`${url.toString()}: ${error.message}`);
		}
	}

	throw new Error(`Unable to fetch Google Trends data. ${errors.join(' | ')}`);
}

const toTrendDigest = (trends) => trends.map((trend, index) => ({
	rank: index + 1,
	title: trend.title,
	traffic: trend.traffic || null,
	description: trend.description || null,
	related_titles: trend.relatedTitles || [],
	link: trend.link || null,
}));

const buildPrompt = ({ trends, selectedTrends, trendDate, sourceUrl }) => `
你是 TennisHub 的中文网球新闻编辑和 SEO 编辑。请根据 Google Trends 搜索趋势，为 https://tennisplayerstory.com/zh/stories 生成一篇面向中文搜索用户的网球新闻热点文章，不要写成泛泛的趋势介绍、人物小传或心得随笔。

要求：
- 以最相关的网球趋势及其提供的新闻标题、摘要为新闻事实依据，第一段直接交代“谁、发生了什么、何时、何地、为何值得关注”。
- 使用倒金字塔新闻结构：导语、已知事实与背景、对赛事/球员/网坛的影响；可用小标题分段。不得把“搜索热度”本身当作文章主体。
- 只能陈述趋势数据中可支持的事实；不确定的细节必须省略，不得臆造采访、比分、行程、引语、原因或具体数据。
- 标题须自然包含核心中文网球关键词和新闻事件，避免“引热议”“永恒魅力”等空泛措辞；meta_description 须概括新闻事实并包含主关键词。
- 内容应围绕一个清晰的新闻角度，服务搜索“球员/赛事 + 最新消息”的读者；不要牵强连接非网球趋势。
- 写作风格：客观、准确、清晰，避免营销腔、情绪化赞美和无依据的预测。
- 正文必须不少于 2500 个中文字符，建议控制在 2800-3500 个中文字符；使用 10-12 个内容充实的自然段，每段约 220-320 个非空白中文字符，可用 3-5 个具体小标题组织信息。输出前自行检查正文总长度。
- 扩充篇幅时应补充趋势数据能够支持的赛事背景、球员背景、事件脉络、影响与后续看点，不得重复同一观点凑字数，也不得为了达到长度而编造事实。
- tags 包含“网球新闻”“网球热点”及相关球员、赛事或事件关键词。
- 输出必须是 JSON，不要 Markdown 代码块。

请返回这个 JSON 结构：
{
  "title": "50字以内中文标题",
  "player_name": "主要球员或主题；如果没有单一球员，用 Google Trends",
  "content": "完整中文文章，分段，用换行分隔",
  "tags": ["网球新闻", "网球热点", "..."],
  "meta_description": "120字以内中文SEO摘要"
}

日期：${trendDate}
来源：${sourceUrl}

优先参考的网球相关趋势：
${JSON.stringify(toTrendDigest(selectedTrends), null, 2)}

今日 Google Trends 原始趋势摘要：
${JSON.stringify(toTrendDigest(trends.slice(0, 10)), null, 2)}
`;

const buildTranslationPrompt = ({ article, language }) => `
Translate the following Chinese tennis news article into ${language.name} for the matching language version of TennisHub.

Requirements:
- Translate the complete article faithfully. Do not summarize, shorten, omit paragraphs, or add facts.
- Preserve the objective news structure, headings, event chronology, player names, tournament names, and all factual qualifications.
- Keep ATP, WTA, official tournament names, player names, and tennis terminology accurate and natural for ${language.name} readers.
- Write a natural, search-friendly title and meta description in ${language.name}; retain the specific player, event, tournament, or tennis-news keywords from the Chinese source.
- Translate tags where appropriate, while preserving internationally recognized proper names.
- Do not invent quotes, scores, dates, causes, statistics, or reporting details.
- Return only valid JSON without a Markdown code block.

Return this JSON structure:
{
  "title": "Localized SEO news title",
  "player_name": "Localized main player or subject",
  "content": "Complete translated article with paragraph breaks",
  "tags": ["localized tennis news tags"],
  "meta_description": "Localized SEO summary"
}

Chinese source article:
${JSON.stringify(article, null, 2)}
`;

const parseJsonObject = (text) => {
	if (!text) throw new Error('AI response was empty');

	try {
		return JSON.parse(text);
	} catch {
		const match = text.match(/\{[\s\S]*\}/);
		if (!match) throw new Error('AI response did not contain a JSON object');
		return JSON.parse(match[0]);
	}
};

const extractResponseText = (data) => {
	if (typeof data.output_text === 'string') return data.output_text;

	const output = Array.isArray(data.output) ? data.output : [];
	const textParts = [];

	for (const item of output) {
		const content = Array.isArray(item.content) ? item.content : [];
		for (const part of content) {
			if (typeof part.text === 'string') textParts.push(part.text);
			if (typeof part.content === 'string') textParts.push(part.content);
		}
	}

	return textParts.join('\n').trim();
};

const sanitizeProviderError = (value) => String(value || '')
	.replace(/\bsk-[A-Za-z0-9_.*-]+/g, '[redacted API key]');

const isLengthValidationError = (error) => (
	error?.code === 'ARTICLE_TOO_SHORT' || error?.code === 'TRANSLATION_TOO_SHORT'
);

const buildLengthExpansionPrompt = ({ sourcePrompt, draft, error, subject }) => `
Complete the following ${subject}, which is valid but shorter than the required minimum.

Original source and factual constraints:
${sourcePrompt}

Existing draft:
${JSON.stringify(draft, null, 2)}

The existing body has ${error.actualCharacters} non-whitespace characters and must reach at least ${error.minimumCharacters}.
Return only this JSON object:
{
  "additional_content": "New sections to append to the existing body"
}

Write ${subject === 'Chinese article' ? '3-5 substantial new Chinese paragraphs totaling at least' : 'complete translated paragraphs totaling at least'} ${Math.max((error.minimumCharacters - error.actualCharacters) + 500, 800)} non-whitespace characters. Add distinct, useful context that the original source supports. Do not repeat the existing draft, summarize it, or add unsupported facts, quotes, scores, dates, statistics, causes, or predictions. Do not return the title or the existing content.
`;

async function generateWithLengthRetry({
	generator,
	prompt,
	instructions,
	parseResponse,
	parseDraft,
	validateDraft,
	subject,
}) {
	const configuredAttempts = Number(
		process.env.TREND_ARTICLE_GENERATION_ATTEMPTS || DEFAULT_GENERATION_ATTEMPTS,
	);
	const attempts = Number.isFinite(configuredAttempts)
		? Math.max(Math.floor(configuredAttempts), 1)
		: DEFAULT_GENERATION_ATTEMPTS;
	const errors = [];
	let responseText = '';
	let draft = null;
	let lengthError = null;

	try {
		responseText = await generator({ prompt, instructions });
		return parseResponse(responseText);
	} catch (error) {
		errors.push(error.message);
		if (!isLengthValidationError(error) || !responseText || attempts === 1) {
			throw new Error(errors.join(' | '));
		}

		draft = parseDraft(responseText);
		lengthError = error;
	}

	for (let attempt = 2; attempt <= attempts; attempt += 1) {
		logger.warn(`${subject} was too short; requesting additional sections (${attempt}/${attempts})`);

		try {
			const expansionResponse = await generator({
				prompt: buildLengthExpansionPrompt({
					sourcePrompt: prompt,
					draft,
					error: lengthError,
					subject,
				}),
				instructions: `Extend the supplied ${subject} using only supported facts. Return only valid JSON with an additional_content field.`,
			});
			const expansion = parseJsonObject(expansionResponse);
			const additionalContent = String(expansion.additional_content || '').trim();
			if (!additionalContent) {
				throw new Error(`${subject} expansion did not contain additional_content`);
			}

			draft = {
				...draft,
				content: `${draft.content}\n\n${additionalContent}`,
			};

			try {
				return validateDraft(draft);
			} catch (error) {
				errors.push(error.message);
				if (!isLengthValidationError(error) || attempt === attempts) {
					throw error;
				}
				lengthError = error;
			}
		} catch (error) {
			if (!errors.includes(error.message)) errors.push(error.message);
			if (!isLengthValidationError(error) || attempt === attempts) {
				throw new Error(errors.join(' | '));
			}
		}
	}

	throw new Error(errors.join(' | '));
}

async function generateArticleWithOpenAI({ prompt, instructions = ARTICLE_SYSTEM_INSTRUCTIONS }) {
	const response = await fetch('https://api.openai.com/v1/responses', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
			instructions,
			input: prompt,
			max_output_tokens: Number(process.env.TREND_ARTICLE_MAX_OUTPUT_TOKENS || DEFAULT_MAX_OUTPUT_TOKENS),
			temperature: Number(process.env.TREND_ARTICLE_TEMPERATURE || 0.4),
			store: false,
		}),
	});

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(`OpenAI article generation failed with ${response.status}: ${sanitizeProviderError(data?.error?.message || JSON.stringify(data))}`);
	}

	return extractResponseText(data);
}

async function generateArticleWithDeepSeek({ prompt, instructions = ARTICLE_SYSTEM_INSTRUCTIONS }) {
	const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
			messages: [
				{ role: 'system', content: instructions },
				{ role: 'user', content: prompt },
			],
			max_tokens: Number(process.env.TREND_ARTICLE_MAX_OUTPUT_TOKENS || DEFAULT_MAX_OUTPUT_TOKENS),
			temperature: Number(process.env.TREND_ARTICLE_TEMPERATURE || 0.4),
			stream: false,
		}),
	});

	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(`DeepSeek article generation failed with ${response.status}: ${sanitizeProviderError(data?.error?.message || JSON.stringify(data))}`);
	}

	return data?.choices?.[0]?.message?.content || '';
}

const parseArticleDraft = (responseText, fallbackPlayerName = 'Google Trends') => {
	const parsed = typeof responseText === 'string' ? parseJsonObject(responseText) : responseText;

	if (!parsed.title || !parsed.content) {
		throw new Error('Generated article is missing title or content');
	}

	const article = {
		title: String(parsed.title).trim(),
		player_name: String(parsed.player_name || fallbackPlayerName).trim(),
		content: String(parsed.content).trim(),
		tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
		meta_description: String(parsed.meta_description || '').trim(),
	};

	return article;
};

const validateGeneratedArticle = (article) => {
	const minimumCharacters = Number(
		process.env.TREND_ARTICLE_MIN_CHARACTERS || DEFAULT_MIN_ARTICLE_CHARACTERS,
	);
	const contentCharacters = Array.from(article.content.replace(/\s/g, '')).length;

	if (contentCharacters < minimumCharacters) {
		const error = new Error(
			`Generated article is too short: ${contentCharacters} characters; minimum is ${minimumCharacters}`,
		);
		error.code = 'ARTICLE_TOO_SHORT';
		error.actualCharacters = contentCharacters;
		error.minimumCharacters = minimumCharacters;
		throw error;
	}

	return article;
};

const parseGeneratedArticle = responseText => validateGeneratedArticle(parseArticleDraft(responseText));

const validateTranslatedArticle = (translation, language) => {
	const minimumCharacters = Number(
		process.env.TREND_ARTICLE_MIN_TRANSLATION_CHARACTERS || DEFAULT_MIN_TRANSLATION_CHARACTERS,
	);
	const contentCharacters = Array.from(translation.content.replace(/\s/g, '')).length;

	if (contentCharacters < minimumCharacters) {
		const error = new Error(
			`${language.name} translation is too short: ${contentCharacters} characters; minimum is ${minimumCharacters}`,
		);
		error.code = 'TRANSLATION_TOO_SHORT';
		error.actualCharacters = contentCharacters;
		error.minimumCharacters = minimumCharacters;
		throw error;
	}

	return translation;
};

const parseTranslatedArticle = (responseText, language) => (
	validateTranslatedArticle(parseArticleDraft(responseText), language)
);

async function generateArticle({ trends, selectedTrends, trendDate, sourceUrl }) {
	const prompt = buildPrompt({ trends, selectedTrends, trendDate, sourceUrl });
	const errors = [];
	let article = null;

	if (process.env.OPENAI_API_KEY) {
		try {
			article = await generateWithLengthRetry({
				generator: generateArticleWithOpenAI,
				prompt,
				instructions: ARTICLE_SYSTEM_INSTRUCTIONS,
				parseResponse: parseGeneratedArticle,
				parseDraft: parseArticleDraft,
				validateDraft: validateGeneratedArticle,
				subject: 'Chinese article',
			});
		} catch (error) {
			errors.push(error.message);
			logger.warn('OpenAI article generation failed; trying fallback provider');
		}
	}

	if (!article && process.env.DEEPSEEK_API_KEY) {
		try {
			article = await generateWithLengthRetry({
				generator: generateArticleWithDeepSeek,
				prompt,
				instructions: ARTICLE_SYSTEM_INSTRUCTIONS,
				parseResponse: parseGeneratedArticle,
				parseDraft: parseArticleDraft,
				validateDraft: validateGeneratedArticle,
				subject: 'Chinese article',
			});
		} catch (error) {
			errors.push(error.message);
		}
	}

	if (!article) {
		throw new Error(`No AI provider could generate the article. ${errors.join(' | ')}`);
	}

	return article;
}

async function translateArticle(article, language) {
	const prompt = buildTranslationPrompt({ article, language });
	const instructions = `You are a professional ${language.name} tennis news translator and SEO editor. Translate only the supplied article, preserve every supported fact, and return only valid JSON.`;
	const errors = [];
	let translation = null;

	if (process.env.OPENAI_API_KEY) {
		try {
			translation = await generateWithLengthRetry({
				generator: generateArticleWithOpenAI,
				prompt,
				instructions,
				parseResponse: responseText => parseTranslatedArticle(responseText, language),
				parseDraft: parseArticleDraft,
				validateDraft: draft => validateTranslatedArticle(draft, language),
				subject: `${language.name} translation`,
			});
		} catch (error) {
			errors.push(error.message);
			logger.warn(`OpenAI ${language.code} translation failed; trying fallback provider`);
		}
	}

	if (!translation && process.env.DEEPSEEK_API_KEY) {
		try {
			translation = await generateWithLengthRetry({
				generator: generateArticleWithDeepSeek,
				prompt,
				instructions,
				parseResponse: responseText => parseTranslatedArticle(responseText, language),
				parseDraft: parseArticleDraft,
				validateDraft: draft => validateTranslatedArticle(draft, language),
				subject: `${language.name} translation`,
			});
		} catch (error) {
			errors.push(error.message);
		}
	}

	if (!translation) {
		throw new Error(`No AI provider could generate the ${language.name} translation. ${errors.join(' | ')}`);
	}

	return translation;
}

async function generateArticleTranslations(article) {
	const translations = { zh: article };

	for (const language of ARTICLE_TRANSLATION_LANGUAGES) {
		translations[language.code] = await translateArticle(article, language);
	}

	return translations;
}

const getTrendDate = () => {
	const parts = new globalThis.Intl.DateTimeFormat('en-US', {
		timeZone: process.env.TREND_ARTICLE_TIMEZONE || 'Asia/Shanghai',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(new Date());

	const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
	return `${values.year}-${values.month}-${values.day}`;
};

async function findExistingDailyArticle(trendDate) {
	const records = await pb.collection('articles').getList(1, 50, {
		filter: `trend_source="google_trends" && trend_date="${trendDate}"`,
		sort: '-created',
		$autoCancel: false,
	});

	return records.items[0] || null;
}

const normalizeTags = (tags) => {
	const set = new Set([
		'网球新闻',
		'网球热点',
		...tags,
	].map(tag => String(tag || '').trim()).filter(tag => tag && tag.toLowerCase() !== 'google trends'));

	return [...set].slice(0, 10);
};

const normalizeTranslations = (translations) => Object.fromEntries(
	Object.entries(translations || {}).map(([language, translation]) => [
		language,
		{
			...translation,
			tags: language === 'zh'
				? normalizeTags(translation.tags || [])
				: [...new Set((translation.tags || []).map(tag => String(tag).trim()).filter(Boolean))].slice(0, 10),
		},
	]),
);

async function logTrendArticleRun(data) {
	try {
		await pb.collection('scrape_logs').create({
			source: 'GOOGLE_TRENDS_ARTICLE',
			status: data.status,
			message: data.message,
			players: data.trendCount || 0,
			errors: data.error || '',
			syncResult: JSON.stringify(data),
			timestamp: new Date().toISOString(),
		}, { $autoCancel: false });
	} catch (error) {
		logger.warn('Failed to log Google Trends article run:', error.message);
	}
}

async function executeDailyTrendArticlePublish({ force = false } = {}) {
	const trendDate = getTrendDate();

	if (!force) {
		const existing = await findExistingDailyArticle(trendDate);
		if (existing) {
			return {
				skipped: true,
				reason: `Google Trends article already exists for ${trendDate}`,
				article: existing,
			};
		}
	}

	try {
		const draft = await prepareDailyTrendArticleDraft({ trendDate });
		const translations = normalizeTranslations(draft.translations);

		const article = await pb.collection('articles').create({
			title: draft.article.title,
			player_name: draft.article.player_name,
			content: draft.article.content,
			status: 'approved',
			tags: normalizeTags(draft.article.tags),
			meta_description: draft.article.meta_description,
			trend_source: 'google_trends',
			trend_date: trendDate,
			trend_terms: draft.selectedTrends.map(trend => trend.title),
			trend_source_url: draft.sourceUrl,
			translations,
			translation_languages: Object.keys(translations),
		}, { $autoCancel: false });

		await logTrendArticleRun({
			status: 'success',
			message: `Published Google Trends article for ${trendDate}`,
			articleId: article.id,
			trendCount: draft.selectedTrends.length,
			trends: draft.selectedTrends.map(trend => trend.title),
			languages: Object.keys(translations),
		});

		return {
			skipped: false,
			article,
			trends: draft.selectedTrends,
			sourceUrl: draft.sourceUrl,
			trendDate,
		};
	} catch (error) {
		if (error.code === 'NO_TENNIS_TRENDS') {
			await logTrendArticleRun({
				status: 'skipped',
				message: error.message,
				trendCount: 0,
			});
			return {
				skipped: true,
				reason: error.message,
			};
		}

		await logTrendArticleRun({
			status: 'failed',
			message: `Failed to publish Google Trends article for ${trendDate}`,
			error: error.message,
		});
		throw error;
	}
}

export async function publishDailyTrendArticle({ force = false } = {}) {
	if (force) {
		return executeDailyTrendArticlePublish({ force: true });
	}

	if (activeDailyPublish) {
		return activeDailyPublish;
	}

	const publishRun = executeDailyTrendArticlePublish();
	activeDailyPublish = publishRun;

	try {
		return await publishRun;
	} finally {
		if (activeDailyPublish === publishRun) {
			activeDailyPublish = null;
		}
	}
}

export async function prepareDailyTrendArticleDraft({ trendDate = getTrendDate() } = {}) {
	const { trends, sourceUrl } = await fetchGoogleTrends();
	const keywords = getConfiguredKeywords();
	const tennisTrends = trends.filter(trend => isTennisTrend(trend, keywords));
	const allowGeneralTrends = process.env.TREND_ARTICLE_ALLOW_GENERAL_TRENDS === 'true';
	const selectedTrends = tennisTrends.length > 0
		? tennisTrends.slice(0, 5)
		: (allowGeneralTrends ? trends.slice(0, 5) : []);

	if (selectedTrends.length === 0) {
		throw new NoTennisTrendsError('Google Trends returned no tennis-related topics; skipped without publishing.');
	}

	const article = await generateArticle({
		trends,
		selectedTrends,
		trendDate,
		sourceUrl,
	});
	const translations = await generateArticleTranslations(article);

	return {
		article,
		translations,
		selectedTrends,
		sourceUrl,
		trendDate,
	};
}
