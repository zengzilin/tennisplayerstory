export const SUPPORT_EMAIL = 'support@tennisplayerstory.com';
export const SITE_ORIGIN = 'https://tennisplayerstory.com';
export const validStoryId = id => /^[a-zA-Z0-9_-]{1,40}$/.test(id || '');
export const storyPath = (lang, id) => `/${lang}/stories/${encodeURIComponent(id)}`;

export function storyAuthor(article, fallback = 'TennisHub contributor') {
  return article.expand?.author?.name || article.author_name || article.author?.name || fallback;
}

export function storySource(article) {
  const value = article.trend_source_url || article.source_url;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
