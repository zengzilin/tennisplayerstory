import { publicPages, siteLanguages } from './public-pages.mjs';
import { articleLanguages } from './article-seo.mjs';

const escapeXml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
const lastModified = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

/** Build the production sitemap or its static fallback from known public records. */
export function renderSitemapXml({ baseUrl, articles = [], vlogs = [] }) {
  const urls = [];
  for (const page of publicPages) {
    if (page.noindex) continue;
    for (const lang of page.languages || siteLanguages) {
      urls.push({ loc: `${baseUrl}/${lang}${page.path}`, changefreq: page.changefreq, priority: page.priority });
    }
  }
  for (const article of articles) {
    if (article.status !== 'approved') continue;
    for (const lang of articleLanguages(article)) {
      urls.push({ loc: `${baseUrl}/${lang}/stories/${encodeURIComponent(article.id)}`, lastmod: lastModified(article.updated), changefreq: 'monthly', priority: '0.7' });
    }
  }
  for (const vlog of vlogs) {
    if (!['published', 'approved'].includes(vlog.status)) continue;
    for (const lang of siteLanguages) {
      urls.push({ loc: `${baseUrl}/${lang}/vlog/${encodeURIComponent(vlog.id)}`, lastmod: lastModified(vlog.updated), changefreq: 'monthly', priority: '0.6' });
    }
  }
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls.map(url => [
    '  <url>', `    <loc>${escapeXml(url.loc)}</loc>`,
    ...(url.lastmod ? [`    <lastmod>${url.lastmod}</lastmod>`] : []),
    `    <changefreq>${url.changefreq}</changefreq>`, `    <priority>${url.priority}</priority>`, '  </url>',
  ].join('\n')), '</urlset>', ''].join('\n');
}
