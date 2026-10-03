import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { getPlatformPool } from './mysql-platform.js';
import { siteLanguages } from '../../../../shared/public-pages.mjs';
import { SUPPORT_EMAIL, SITE_ORIGIN, validStoryId, storyPath, storyAuthor, storySource } from '../../../../shared/site-info.mjs';
import { localizeArticle } from '../../../web/src/lib/localizeArticle.js';
import logger from '../utils/logger.js';

const router = Router();
const htmlEscape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export async function loadApprovedStory(id, pool) {
  if (!validStoryId(id)) return null;
  const [rows] = await (pool || getPlatformPool()).execute(`SELECT a.record_id AS id, a.data, a.created, a.updated,
    JSON_UNQUOTE(JSON_EXTRACT(u.data, '$.name')) AS authorName
    FROM pb_records a LEFT JOIN pb_records u ON u.collection_name = 'users'
    AND u.record_id = JSON_UNQUOTE(JSON_EXTRACT(a.data, '$.author'))
    WHERE a.collection_name = 'articles' AND a.record_id = ?
    AND JSON_UNQUOTE(JSON_EXTRACT(a.data, '$.status')) = 'approved' LIMIT 1`, [id]);
  if (!rows[0]) return null;
  const row = rows[0];
  const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  if (data.status !== 'approved') return null;
  return { ...data, id: row.id, created: row.created, updated: row.updated, expand: { author: { name: row.authorName } } };
}

/** Put public content into the initial HTML; React replaces it after loading. */
export function renderPublicHtml(template, { lang, title, description, path, body, noindex = false, schema }) {
  const canonical = `${SITE_ORIGIN}${path}`;
  const head = `<title data-rh="true">${htmlEscape(title)} | TennisHub</title>
    <meta data-rh="true" name="description" content="${htmlEscape(description)}" />
    <meta data-rh="true" name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />
    <link data-rh="true" rel="canonical" href="${htmlEscape(canonical)}" />
    <meta data-rh="true" property="og:title" content="${htmlEscape(title)}" />
    <meta data-rh="true" property="og:description" content="${htmlEscape(description)}" />
    <meta data-rh="true" property="og:url" content="${htmlEscape(canonical)}" />
    ${schema ? `<script data-rh="true" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`;
  const content = `<div class="min-h-screen bg-background text-foreground"><header class="border-b p-5"><a href="/${lang}" class="font-bold">TennisHub</a></header>
    <main id="main-content" class="max-w-3xl mx-auto px-4 py-10">${body}</main>
    <footer class="border-t p-5"><a href="/${lang}/about">${lang === 'zh' ? '关于我们' : 'About us'}</a> · <a href="/${lang}/contact">${lang === 'zh' ? '联系我们' : 'Contact us'}</a> · <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></footer></div>`;
  return template.replace(/<html[^>]*>/, `<html lang="${lang}">`).replace(/<title>[\s\S]*?<\/title>/, head).replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

export function storyHtml(article, lang, labels) {
  const localized = localizeArticle(article, lang);
  const author = storyAuthor(article, labels.contributor);
  const source = storySource(article);
  const date = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;
  const published = date(article.created);
  const updated = date(article.updated);
  const body = `<a href="/${lang}/stories">${htmlEscape(labels.back)}</a><article>
    <p class="text-sm text-muted-foreground mt-6">${htmlEscape(article.trend_source ? labels.automated : labels.community)}</p>
    <h1 class="text-3xl font-bold my-5">${htmlEscape(localized.title)}</h1>
    <p>${htmlEscape(labels.author)}: ${htmlEscape(author)}${published ? ` · ${htmlEscape(labels.date)} <time datetime="${published}">${published.slice(0, 10)}</time>` : ''}</p>
    <div class="space-y-6 text-lg leading-8 mt-8">${String(localized.content || '').split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p class="whitespace-pre-wrap break-words">${htmlEscape(paragraph)}</p>`).join('')}</div>
    ${source ? `<aside class="mt-8"><h2>${htmlEscape(labels.source)}</h2><a href="${htmlEscape(source)}" rel="noopener noreferrer">${htmlEscape(new URL(source).hostname)}</a></aside>` : ''}
    <p class="mt-8"><a href="mailto:${SUPPORT_EMAIL}">${htmlEscape(labels.correction)}</a></p></article>`;
  return { lang, title: localized.title, description: localized.meta_description || String(localized.content || '').slice(0, 160), path: storyPath(lang, article.id), body,
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: localized.title, author: { '@type': 'Person', name: author }, publisher: { '@type': 'Organization', name: 'TennisHub' }, mainEntityOfPage: `${SITE_ORIGIN}${storyPath(lang, article.id)}`, ...(published ? { datePublished: published } : {}), ...(updated ? { dateModified: updated } : {}) } };
}

// Explicit public paths only; no authentication or account data enters this HTML.
router.use(async (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) return next();
  const legacy = req.path.match(/^\/(en|zh|ja|es|fr|de)\/stories\/?$/);
  if (legacy && validStoryId(req.query.article)) return res.redirect(301, storyPath(legacy[1], req.query.article));
  const match = req.path.match(/^\/(en|zh|ja|es|fr|de)\/(about|contact|privacy-policy|terms-of-service|stories\/([^/]+))\/?$/);
  if (!match || !siteLanguages.includes(match[1])) return next();
  const [, lang, page, id] = match;
  res.set('Cache-Control', 'no-store');
  let html;
  try {
    const [template, enText, localText] = await Promise.all([
      readFile(res.locals.publicHtmlIndex, 'utf8'),
      readFile(new URL('../../../web/src/i18n/locales/en.json', import.meta.url), 'utf8'),
      readFile(new URL('../../../web/src/i18n/locales/zh.json', import.meta.url), 'utf8'),
    ]);
    const copy = JSON.parse(lang === 'zh' ? localText : enText);
    if (page.startsWith('stories/')) {
      const article = validStoryId(id) ? await loadApprovedStory(id) : null;
      html = article ? storyHtml(article, lang, copy.storyDetail) : { lang, path: req.path, title: copy.storyDetail.missing, description: copy.storyDetail.missing, noindex: true, body: `<h1>${htmlEscape(copy.storyDetail.missing)}</h1><a href="/${lang}/stories">${htmlEscape(copy.storyDetail.back)}</a>` };
      if (!article) res.status(404);
    } else {
      const key = page === 'privacy-policy' ? 'privacy' : page === 'terms-of-service' ? 'terms' : page;
      const info = copy.siteInfo[key];
      html = { lang, path: `/${lang}/${page}`, title: info.title, description: info.description,
        body: `<h1 class="text-3xl font-bold mb-5">${htmlEscape(info.title)}</h1><p>${htmlEscape(info.description)}</p>${key === 'contact' ? `<p class="my-6"><a href="mailto:${SUPPORT_EMAIL}" class="text-primary underline">${SUPPORT_EMAIL}</a></p>` : ''}<p class="my-4">${htmlEscape(copy.siteInfo.updated)}: 2026-10-03</p>
        ${info.sections.map(section => `<section class="my-8"><h2 class="text-xl font-bold mb-3">${htmlEscape(section.title)}</h2><p class="leading-8">${htmlEscape(section.content)}</p></section>`).join('')}
        ${key === 'privacy' ? `<p><a href="https://policies.google.com/privacy">${htmlEscape(copy.siteInfo.googlePrivacy)}</a> · <a href="https://myadcenter.google.com/">${htmlEscape(copy.siteInfo.adSettings)}</a></p>` : ''}` };
    }
    return res.type('html').send(renderPublicHtml(template, html));
  } catch (error) {
    logger.error(`Public page rendering failed: ${error.message}`);
    res.set('Retry-After', '60');
    return res.status(503).type('html').send(`<html lang="${lang}"><head><meta data-rh="true" name="robots" content="noindex, follow"></head><body><h1>${lang === 'zh' ? '页面暂时无法加载，请稍后重试' : 'Page temporarily unavailable. Please retry later.'}</h1><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></body></html>`);
  }
});

export default router;
