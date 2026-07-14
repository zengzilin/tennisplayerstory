const parseTranslations = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
};

export const normalizeArticleLanguage = (language) => {
  const normalized = String(language || '').trim().toLowerCase().split('-')[0];
  return normalized || 'zh';
};

export const localizeArticle = (article, language) => {
  if (!article) return article;

  const translations = parseTranslations(article.translations);
  const languageCode = normalizeArticleLanguage(language);
  const translation = translations?.[languageCode];

  if (!translation || typeof translation !== 'object') return article;

  return {
    ...article,
    title: translation.title || article.title,
    player_name: translation.player_name || article.player_name,
    content: translation.content || article.content,
    tags: Array.isArray(translation.tags) ? translation.tags : article.tags,
    meta_description: translation.meta_description || article.meta_description,
    localized_language: languageCode,
  };
};
