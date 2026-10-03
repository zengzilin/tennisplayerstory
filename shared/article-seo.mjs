import { siteLanguages } from './public-pages.mjs';
import { parseArticleTranslations, normalizeArticleLanguage } from '../apps/web/src/lib/localizeArticle.js';

// Existing Chinese contributions predate the language field.
export function articleLanguages(article) {
  const original = normalizeArticleLanguage(article.language || 'zh');
  const translations = parseArticleTranslations(article.translations) || {};
  return siteLanguages.filter(lang => lang === original || (
    typeof translations[lang]?.title === 'string' && translations[lang].title.trim()
    && typeof translations[lang]?.content === 'string' && translations[lang].content.trim()
  ));
}

export function articleCanonicalLanguage(article, requestedLanguage) {
  const languages = articleLanguages(article);
  return languages.includes(requestedLanguage) ? requestedLanguage : normalizeArticleLanguage(article.language || 'zh');
}
