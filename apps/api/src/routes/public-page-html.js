import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { getPlatformPool } from './mysql-platform.js';
import { publicPages, siteLanguages } from '../../../../shared/public-pages.mjs';
import { SUPPORT_EMAIL, SITE_ORIGIN, validStoryId, storyPath, storyAuthor, storySource } from '../../../../shared/site-info.mjs';
import { articleLanguages, articleCanonicalLanguage } from '../../../../shared/article-seo.mjs';
import { localizeArticle } from '../../../web/src/lib/localizeArticle.js';
import { seoConfig } from '../../../web/src/lib/seoConfig.js';
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
export function renderPublicHtml(template, { lang, title, description, path, body, noindex = false, schema, alternateLanguages = siteLanguages }) {
  const canonical = `${SITE_ORIGIN}${path}`;
  const languagePath = path.replace(/^\/(en|zh|ja|es|fr|de)(?=\/|$)/, '');
  const head = `<title data-rh="true">${htmlEscape(title)} | TennisHub</title>
    <meta data-rh="true" name="description" content="${htmlEscape(description)}" />
    <meta data-rh="true" name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />
    <link data-rh="true" rel="canonical" href="${htmlEscape(canonical)}" />
    <meta data-rh="true" property="og:title" content="${htmlEscape(title)}" />
    <meta data-rh="true" property="og:description" content="${htmlEscape(description)}" />
    <meta data-rh="true" property="og:url" content="${htmlEscape(canonical)}" />
    ${!noindex ? alternateLanguages.map(language => `<link data-rh="true" rel="alternate" hreflang="${language}" href="${SITE_ORIGIN}/${language}${htmlEscape(languagePath)}" />`).join('\n') : ''}
    ${!noindex && alternateLanguages.length ? `<link data-rh="true" rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/${alternateLanguages.includes('en') ? 'en' : alternateLanguages[0]}${htmlEscape(languagePath)}" />` : ''}
    ${schema ? `<script data-rh="true" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`;
  const content = `<div class="min-h-screen bg-background text-foreground"><header class="border-b p-5"><a href="/${lang}" class="font-bold">TennisHub</a></header>
    <main id="main-content" class="max-w-3xl mx-auto px-4 py-10">${body}</main>
    <footer class="border-t p-5"><a href="/${lang}/about">${lang === 'zh' ? '关于我们' : 'About us'}</a> · <a href="/${lang}/contact">${lang === 'zh' ? '联系我们' : 'Contact us'}</a> · <a href="/${lang}/privacy-policy">${lang === 'zh' ? '隐私政策' : 'Privacy policy'}</a> · <a href="/${lang}/terms-of-service">${lang === 'zh' ? '使用条款' : 'Terms of use'}</a> · <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></footer></div>`;
  return template.replace(/<html[^>]*>/, `<html lang="${lang}">`).replace(/<title>[\s\S]*?<\/title>/, head).replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

export function storyHtml(article, lang, labels) {
  const localized = localizeArticle(article, lang);
  const canonicalLanguage = articleCanonicalLanguage(article, lang);
  const author = storyAuthor(article, labels.contributor);
  const source = storySource(article);
  const date = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;
  const published = date(article.created);
  const updated = date(article.updated);
  const body = `<a href="/${lang}/stories">${htmlEscape(labels.back)}</a><article>
    <p class="text-sm text-muted-foreground mt-6">${htmlEscape(article.trend_source ? labels.automated : labels.community)}</p>
    <h1 class="text-3xl font-bold my-5">${htmlEscape(localized.title)}</h1>
    <p>${htmlEscape(labels.author)}: ${htmlEscape(author)}${published ? ` · ${htmlEscape(labels.date)} <time datetime="${published}">${published.slice(0, 10)}</time>` : ''}</p>
    <div lang="${canonicalLanguage}" class="space-y-6 text-lg leading-8 mt-8">${String(localized.content || '').split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p class="whitespace-pre-wrap break-words">${htmlEscape(paragraph)}</p>`).join('')}</div>
    ${source ? `<aside class="mt-8"><h2>${htmlEscape(labels.source)}</h2><a href="${htmlEscape(source)}" rel="noopener noreferrer">${htmlEscape(new URL(source).hostname)}</a></aside>` : ''}
    <p class="mt-8"><a href="mailto:${SUPPORT_EMAIL}">${htmlEscape(labels.correction)}</a></p></article>`;
  return { lang, title: localized.title, description: localized.meta_description || String(localized.content || '').slice(0, 160), path: storyPath(canonicalLanguage, article.id), body, alternateLanguages: articleLanguages(article),
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: localized.title, inLanguage: canonicalLanguage, author: { '@type': 'Person', name: author }, publisher: { '@type': 'Organization', name: 'TennisHub' }, mainEntityOfPage: `${SITE_ORIGIN}${storyPath(canonicalLanguage, article.id)}`, ...(published ? { datePublished: published } : {}), ...(updated ? { dateModified: updated } : {}) } };
}

export async function loadApprovedStories(pool) {
  const [rows] = await (pool || getPlatformPool()).execute(`SELECT record_id AS id, data, created, updated
    FROM pb_records WHERE collection_name = 'articles'
    AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.status')) = 'approved'
    ORDER BY created DESC LIMIT 50`);
  return rows.map(row => ({ ...(typeof row.data === 'string' ? JSON.parse(row.data) : row.data), id: row.id, created: row.created, updated: row.updated }));
}

export function publicPageHtml(page, lang, copy, articles = []) {
  const pageKey = page.id === 'live-matches' ? 'liveMatches' : page.id;
  const metadata = seoConfig.pages[pageKey] || page;
  const title = copy.seo?.[pageKey]?.title || metadata.title;
  const description = copy.seo?.[pageKey]?.description || metadata.description;
  const links = publicPages.map(item => `<li><a href="/${lang}${item.path}">${htmlEscape(copy.nav?.[item.id] || item.title)}</a></li>`).join('');
  let body = `<h1 class="text-3xl font-bold mb-5">${htmlEscape(title)}</h1><p class="leading-8">${htmlEscape(description)}</p>`;
  if (page.id === 'stories' || page.id === 'home') {
    body += `<section class="my-8"><h2 class="text-xl font-bold">${htmlEscape(copy.stories.heading)}</h2>${articles.map(article => {
      const localized = localizeArticle(article, lang);
      return `<article class="my-6" lang="${articleCanonicalLanguage(article, lang)}"><h3><a class="underline" href="${storyPath(articleCanonicalLanguage(article, lang), article.id)}">${htmlEscape(localized.title)}</a></h3><p>${htmlEscape(String(localized.content || '').slice(0, 240))}</p></article>`;
    }).join('') || `<p>${htmlEscape(copy.stories.emptyTitle)}</p>`}</section>`;
  }
  if (page.id === 'live-matches') body += `<p role="note" class="my-8">${htmlEscape(copy.liveMatches.notice)}</p>`;
  if (page.id === 'rankings' || page.id === 'players') body += `<p class="my-8">${htmlEscape(copy.siteInfo.about.sections[0].content)}</p><p><a href="https://www.atptour.com/en/rankings/singles">ATP</a> · <a href="https://www.wtatennis.com/rankings/singles">WTA</a></p>`;
  body += `<nav aria-label="${htmlEscape(copy.siteInfo.navigation)}" class="my-8"><ul class="space-y-3">${links}</ul></nav>`;
  return { lang, path: `/${lang}${page.path}`, title, description, body, noindex: Boolean(page.noindex) };
}

// Explicit public paths only; no authentication or account data enters this HTML.
router.use(async (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) return next();
  if (req.path === '/') return res.redirect(301, '/en');
  if (/^\/(en|zh|ja|es|fr|de)\/$/.test(req.path)) return res.redirect(301, req.path.slice(0, -1));
  const legacy = req.path.match(/^\/(en|zh|ja|es|fr|de)\/(stories|news)\/?$/);
  if (legacy && validStoryId(req.query.article)) return res.redirect(301, storyPath(legacy[1], req.query.article));
  const match = req.path.match(/^\/(en|zh|ja|es|fr|de)(?:\/(.*?))?\/?$/);
  if (!match) return next();
  const [, lang, page = ''] = match;
  if (/^(login|signup|forgot-password|reset-password|profile|write-article|my-articles|admin)(\/|$)/.test(page)) {
    res.set('X-Robots-Tag', 'noindex, follow');
    return next();
  }
  // Video details remain handled by the existing client until their renderer is added.
  if (/^vlog\/[^/]+$/.test(page)) return next();
  const id = page.startsWith('stories/') ? page.slice('stories/'.length) : null;
  const publicPage = publicPages.find(item => item.path === (page ? `/${page}` : ''));
  if (req.path.endsWith('/') && (publicPage || validStoryId(id))) return res.redirect(301, req.path.slice(0, -1) + req.url.slice(req.path.length));
  res.set('Cache-Control', 'no-store');
  let html;
  try {
    const [template, localText, englishText] = await Promise.all([
      readFile(res.locals.publicHtmlIndex, 'utf8'),
      readFile(new URL(`../../../web/src/i18n/locales/${lang}.json`, import.meta.url), 'utf8'),
      readFile(new URL('../../../web/src/i18n/locales/en.json', import.meta.url), 'utf8'),
    ]);
    const localCopy = JSON.parse(localText);
    const copy = { ...JSON.parse(englishText), ...localCopy };
    if (id !== null) {
      const article = validStoryId(id) ? await loadApprovedStory(id) : null;
      html = article ? storyHtml(article, lang, copy.storyDetail) : { lang, path: req.path, title: copy.storyDetail.missing, description: copy.storyDetail.missing, noindex: true, body: `<h1>${htmlEscape(copy.storyDetail.missing)}</h1><a href="/${lang}/stories">${htmlEscape(copy.storyDetail.back)}</a>` };
      if (!article) res.status(404);
    } else if (['about', 'contact', 'privacy-policy', 'terms-of-service'].includes(page)) {
      const key = page === 'privacy-policy' ? 'privacy' : page === 'terms-of-service' ? 'terms' : page;
      const info = copy.siteInfo[key];
      const contentLanguage = localCopy.siteInfo?.[key] ? lang : 'en';
      html = { lang, path: `/${contentLanguage}/${page}`, title: info.title, description: info.description, alternateLanguages: ['en', 'zh'],
        body: `<article lang="${contentLanguage}"><h1 class="text-3xl font-bold mb-5">${htmlEscape(info.title)}</h1><p>${htmlEscape(info.description)}</p>${key === 'contact' ? `<p class="my-6"><a href="mailto:${SUPPORT_EMAIL}" class="text-primary underline">${SUPPORT_EMAIL}</a></p>` : ''}<p class="my-4">${htmlEscape(copy.siteInfo.updated)}: 2026-10-03</p>
        ${info.sections.map(section => `<section class="my-8"><h2 class="text-xl font-bold mb-3">${htmlEscape(section.title)}</h2><p class="leading-8">${htmlEscape(section.content)}</p></section>`).join('')}
        ${key === 'privacy' ? `<p><a href="https://policies.google.com/privacy">${htmlEscape(copy.siteInfo.googlePrivacy)}</a> · <a href="https://myadcenter.google.com/">${htmlEscape(copy.siteInfo.adSettings)}</a></p>` : ''}</article>` };
    } else if (publicPage) {
      if (page === 'news' && req.query.view === 'community') return res.redirect(301, `/${lang}/stories`);
      const articles = ['home', 'stories'].includes(publicPage.id) ? await loadApprovedStories() : [];
      html = publicPageHtml(publicPage, lang, copy, articles);
    } else {
      res.status(404);
      html = { lang, path: req.path, title: copy.notFound.title, description: copy.notFound.description, noindex: true, body: `<h1>${htmlEscape(copy.notFound.title)}</h1><p>${htmlEscape(copy.notFound.description)}</p><a href="/${lang}">${htmlEscape(copy.nav.home)}</a>` };
    }
    return res.type('html').send(renderPublicHtml(template, html));
  } catch (error) {
    logger.error(`Public page rendering failed: ${error.message}`);
    res.set('Retry-After', '60');
    return res.status(503).type('html').send(`<html lang="${lang}"><head><meta data-rh="true" name="robots" content="noindex, follow"></head><body><h1>${lang === 'zh' ? '页面暂时无法加载，请稍后重试' : 'Page temporarily unavailable. Please retry later.'}</h1><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></body></html>`);
  }
});

export default router;
