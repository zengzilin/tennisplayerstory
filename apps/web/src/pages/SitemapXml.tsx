// @ts-nocheck

import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { seoConfig } from '@/lib/seoConfig.js';

// Renders the raw XML content. Intended for robots.
const SitemapXml = () => {
  const [xml, setXml] = useState('');

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const [articles, vlogs] = await Promise.all([
          pb.collection('articles').getFullList({ filter: "status='approved'", $autoCancel: false }),
          pb.collection('vlogs').getFullList({ filter: "status='published'", $autoCancel: false })
        ]);

        const baseUrl = seoConfig.siteUrl;
        const today = new Date().toISOString().split('T')[0];

        const staticRoutes = [
          '',
          '/players',
          '/rankings',
          '/stories',
          '/vlogs',
          '/live-matches',
          '/sitemap',
          '/privacy-policy',
          '/terms-of-service'
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        staticRoutes.forEach(route => {
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${baseUrl}/en${route}</loc>\n`;
          sitemap += `    <lastmod>${today}</lastmod>\n`;
          sitemap += `    <changefreq>${route === '' ? 'daily' : 'weekly'}</changefreq>\n`;
          sitemap += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
          sitemap += `  </url>\n`;
        });

        articles.forEach(article => {
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${baseUrl}/en/stories/${article.id}</loc>\n`;
          sitemap += `    <lastmod>${article.updated.split(' ')[0]}</lastmod>\n`;
          sitemap += `    <changefreq>monthly</changefreq>\n`;
          sitemap += `    <priority>0.6</priority>\n`;
          sitemap += `  </url>\n`;
        });

        vlogs.forEach(vlog => {
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${baseUrl}/en/vlog/${vlog.id}</loc>\n`;
          sitemap += `    <lastmod>${vlog.updated.split(' ')[0]}</lastmod>\n`;
          sitemap += `    <changefreq>monthly</changefreq>\n`;
          sitemap += `    <priority>0.6</priority>\n`;
          sitemap += `  </url>\n`;
        });

        sitemap += `</urlset>`;
        setXml(sitemap);
      } catch (error) {
        console.error('Error generating sitemap XML:', error);
        setXml('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
      }
    };

    generateSitemap();
  }, []);

  return (
    <pre style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', margin: 0, padding: '20px', fontFamily: 'monospace', backgroundColor: '#f4f4f4', color: '#333' }}>
      {xml}
    </pre>
  );
};

export default SitemapXml;
