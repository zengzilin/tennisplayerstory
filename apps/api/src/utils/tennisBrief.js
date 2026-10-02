const upstream = 'https://tennis-brief.zengzilin2016.workers.dev';
const topics = ['Tour news', 'Grand Slams', 'US tennis', 'Rankings'];

export function parseBriefFilters(query) {
  const { q = '', source = '', topic = '', page = '1' } = query;
  if (![q, source, topic, page].every(value => typeof value === 'string')
      || q.length > 100 || (source && !['bbc', 'espn'].includes(source))
      || (topic && !topics.includes(topic)) || !/^[1-9]\d?$|^100$/.test(page)) {
    throw new RangeError('Invalid news filters');
  }
  return { q: q.trim(), source, topic, page };
}

// Both the human news page and its Markdown representation use this fixed feed.
export async function fetchTennisBrief(resource, query = {}) {
  if (!['articles', 'status'].includes(resource)) throw new RangeError('Invalid news resource');
  const url = new URL(`/api/v1/${resource}`, upstream);
  if (resource === 'articles') url.search = new URLSearchParams(parseBriefFilters(query)).toString();
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000), redirect: 'error',
  });
  if (!response.ok) throw new Error('News upstream unavailable');
  const data = await response.json();
  if (!data || (resource === 'articles'
    ? !Array.isArray(data.articles) || typeof data.has_more !== 'boolean'
    : !Array.isArray(data.sources))) {
    throw new Error('Invalid news upstream response');
  }
  return data;
}
