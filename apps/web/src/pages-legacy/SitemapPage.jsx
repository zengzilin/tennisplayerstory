
import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { availableLanguages, buildLocalizedPath } from '@/contexts/LanguageContext.jsx';

const baseUrl = 'https://tennishub.com';
const publicStaticSuffixes = [
  '',
  'live-matches',
  'login',
  'signup',
  'privacy-policy',
  'terms-of-service',
];
const localizedRouteKeys = ['players', 'rankings', 'stories'];

const formatLastMod = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toISOString().split('T')[0];
};

const toAbsoluteUrl = (path) => encodeURI(`${baseUrl}${path}`);

const SitemapPage = () => {
  const [xml, setXml] = useState('');

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const players = await pb.collection('players').getFullList({
          sort: '-updated',
          $autoCancel: false,
        });

        const today = new Date().toISOString().split('T')[0];
        const urls = [];

        availableLanguages.forEach(({ code }) => {
          publicStaticSuffixes.forEach((suffix) => {
            const path = suffix ? `/${code}/${suffix}` : `/${code}`;
            urls.push({
              loc: toAbsoluteUrl(path),
              lastmod: today,
              changefreq: suffix ? 'weekly' : 'daily',
              priority: suffix ? '0.8' : '1.0',
            });
          });

          localizedRouteKeys.forEach((routeKey) => {
            urls.push({
              loc: toAbsoluteUrl(buildLocalizedPath(code, routeKey)),
              lastmod: today,
              changefreq: 'weekly',
              priority: '0.8',
            });
          });

          players.forEach((player) => {
            urls.push({
              loc: toAbsoluteUrl(buildLocalizedPath(code, 'players', player.id)),
              lastmod: formatLastMod(player.last_updated || player.updated || player.created, today),
              changefreq: 'weekly',
              priority: '0.7',
            });
          });
        });

        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        urls.forEach(({ loc, lastmod, changefreq, priority }) => {
          sitemap += '  <url>\n';
          sitemap += `    <loc>${loc}</loc>\n`;
          sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
          sitemap += `    <changefreq>${changefreq}</changefreq>\n`;
          sitemap += `    <priority>${priority}</priority>\n`;
          sitemap += '  </url>\n';
        });

        sitemap += '</urlset>';
        setXml(sitemap);
      } catch (error) {
        console.error('Error generating sitemap:', error);
        setXml('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
      }
    };

    generateSitemap();
  }, []);

  return (
    <pre style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
      {xml}
    </pre>
  );
};

export default SitemapPage;
