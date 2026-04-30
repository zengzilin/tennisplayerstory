
import { seoConfig } from './seoConfig.js';

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  logo: `${seoConfig.siteUrl}/logo.png`,
  description: 'Your ultimate destination for everything professional tennis. Live scores, rankings, player profiles, and community stories.',
  sameAs: [
    'https://twitter.com/tennishub',
    'https://instagram.com/tennishub',
    'https://youtube.com/tennishub'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@tennishub.com',
    contactType: 'customer support'
  }
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
  description: article.content ? article.content.substring(0, 150) + '...' : '',
  image: article.image || seoConfig.defaultImage,
  datePublished: article.created,
  dateModified: article.updated || article.created,
  author: {
    '@type': 'Person',
    name: article.expand?.author?.name || article.expand?.author?.email || 'Anonymous'
  },
  publisher: generateOrganizationSchema(),
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${seoConfig.siteUrl}/stories/${article.id}`
  }
});

export const generatePersonSchema = (player) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: player.name,
  image: player.profile_url || player.imageUrl || seoConfig.defaultImage,
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
