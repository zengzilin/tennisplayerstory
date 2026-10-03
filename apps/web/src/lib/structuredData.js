import { SUPPORT_EMAIL } from '../../../../shared/site-info.mjs';
import { articleCanonicalLanguage } from '../../../../shared/article-seo.mjs';
import { storyPath, storyAuthor } from '../../../../shared/site-info.mjs';

import { seoConfig } from './seoConfig.js';

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  description: 'Independent tennis player stories, weekly rankings, source-attributed news links and community contributions.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: SUPPORT_EMAIL,
    contactType: 'customer support'
  }
});

export const generateWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
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

export const generateArticleSchema = (article, language = 'zh') => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.content ? article.content.substring(0, 150) + '...' : '',
  ...(article.image ? { image: article.image } : {}),
  datePublished: article.created,
  dateModified: article.updated || article.created,
  author: {
    '@type': 'Person',
    name: storyAuthor(article)
  },
  publisher: generateOrganizationSchema(),
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${seoConfig.siteUrl}${storyPath(articleCanonicalLanguage(article, language), article.id)}`
  }
});

export const generatePersonSchema = (player) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: player.name,
  ...(player.profile_url || player.imageUrl ? { image: player.profile_url || player.imageUrl } : {}),
  description: player.bio || `Professional tennis player from ${player.country}, ranked ${player.ranking || 'unranked'}.`,
  nationality: {
    '@type': 'Country',
    name: player.country
  },
  jobTitle: 'Professional Tennis Player'
});

export const generateVideoSchema = (vlog) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: vlog.title,
  description: vlog.description || 'Tennis vlog and analysis',
  thumbnailUrl: vlog.thumbnailUrl || vlog.thumbnail_url || seoConfig.defaultImage,
  uploadDate: vlog.created,
  contentUrl: vlog.youtubeUrl,
  embedUrl: vlog.youtubeUrl,
  publisher: generateOrganizationSchema()
});
