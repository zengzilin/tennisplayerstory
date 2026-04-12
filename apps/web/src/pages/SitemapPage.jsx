
import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';

const SitemapPage = () => {
  const [xml, setXml] = useState('');

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const articles = await pb.collection('articles').getFullList({
          filter: 'status="approved"',
          $autoCancel: false
        });

        const baseUrl = 'https://tennishub.com';
        const today = new Date().toISOString().split('T')[0];

        const staticRoutes = [
          '',
          '/live-matches',
          '/players',
          '/rankings',
          '/stories',
          '/login',
          '/signup',
          '/privacy-policy',
          '/terms-of-service'
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Static routes
        staticRoutes.forEach(route => {
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${baseUrl}${route}</loc>\n`;
          sitemap += `    <lastmod>${today}</lastmod>\n`;
          sitemap += `    <changefreq>${route === '' ? 'daily' : 'weekly'}</changefreq>\n`;
          sitemap += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
          sitemap += `  </url>\n`;
        });

        // Dynamic article routes
        articles.forEach(article => {
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${baseUrl}/stories/${article.id}</loc>\n`;
          sitemap += `    <lastmod>${article.updated.split(' ')[0]}</lastmod>\n`;
          sitemap += `    <changefreq>monthly</changefreq>\n`;
          sitemap += `    <priority>0.6</priority>\n`;
          sitemap += `  </url>\n`;
        });

        sitemap += `</urlset>`;
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
