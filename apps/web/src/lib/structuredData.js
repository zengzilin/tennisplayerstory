import { seoConfig } from './seoConfig.js';

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  logo: `${seoConfig.siteUrl}/logo.png`,
  sameAs: [
    'https://twitter.com/tennishub',
    'https://instagram.com/tennishub'
  ]
});

export const generateWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${seoConfig.siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
});

export const generateBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${seoConfig.siteUrl}${item.path}`
  }))
});

export const generateArticleSchema = (article) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  image: article.image || seoConfig.defaultImage,
  datePublished: article.created,
  dateModified: article.updated || article.created,
  author: {
    '@type': 'Person',
    name: article.authorName || 'Anonymous'
  },
  publisher: generateOrganizationSchema()
});

export const generatePersonSchema = (player, path = '') => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: player.name,
  description: `${player.sourceLabel} tennis player from ${player.country}.`,
  nationality: {
    '@type': 'Country',
    name: player.country
  },
  homeLocation: {
    '@type': 'Country',
    name: player.country
  },
  url: path ? `${seoConfig.siteUrl}${path}` : undefined,
  sameAs: player.profileUrl ? [player.profileUrl] : undefined,
  memberOf: {
    '@type': 'SportsOrganization',
    name: player.sourceLabel
  }
});
