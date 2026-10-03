// The sitemap and agent lookup use the same indexable route inventory.
export const siteLanguages = ['en', 'zh', 'ja', 'es', 'fr', 'de'];
export const publicPages = [
  { id: 'home', path: '', title: 'TennisHub', description: 'Tennis news, player stories, rankings and match information.', changefreq: 'daily', priority: '1.0' },
  { id: 'live-matches', path: '/live-matches', title: 'Live tennis scores', description: 'Redirects to TennisScoresToday for tennis scores and match information.', changefreq: 'monthly', priority: '0.3', noindex: true },
  { id: 'players', path: '/players', title: 'Players', description: 'Browse tennis players and the rankings stored on TennisHub.', changefreq: 'weekly', priority: '0.9' },
  { id: 'rankings', path: '/rankings', title: 'Rankings', description: 'Browse stored ATP and WTA rankings. Check update dates before treating rankings as current.', changefreq: 'daily', priority: '0.9' },
  { id: 'news', path: '/news', title: 'Tennis Brief news', description: 'Browse tennis headlines and original English excerpts from ESPN and BBC Sport. Filter by publisher, topic or keyword and follow links to the original reporting.', changefreq: 'daily', priority: '0.8' },
  { id: 'stories', path: '/stories', title: 'Player stories', description: 'Read approved community stories and match analysis. Use the public article lookup for individual records.', changefreq: 'daily', priority: '0.8' },
  { id: 'vlogs', path: '/vlogs', title: 'Tennis vlogs', description: 'Browse published tennis videos. This section is not indexed until it has reviewed content.', noindex: true, changefreq: 'daily', priority: '0.8' },
  { id: 'about', path: '/about', title: 'About TennisHub', description: 'Learn about this independent tennis website, its sources and editorial approach.', languages: ['en', 'zh'], changefreq: 'monthly', priority: '0.5' },
  { id: 'contact', path: '/contact', title: 'Contact TennisHub', description: 'Contact support, report errors, or raise copyright and privacy concerns.', languages: ['en', 'zh'], changefreq: 'monthly', priority: '0.5' },
  { id: 'privacy-policy', path: '/privacy-policy', title: 'Privacy policy', description: 'Read the website privacy policy.', languages: ['en', 'zh'], changefreq: 'yearly', priority: '0.3' },
  { id: 'terms-of-service', path: '/terms-of-service', title: 'Terms of service', description: 'Read the website terms of service.', languages: ['en', 'zh'], changefreq: 'yearly', priority: '0.3' },
  { id: 'sitemap', path: '/sitemap', title: 'Sitemap', description: 'Browse public website navigation.', changefreq: 'monthly', priority: '0.4' },
];
