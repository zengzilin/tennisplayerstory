
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { seoConfig } from '@/lib/seoConfig.js';

const SEOHelmet = ({ 
  pageKey,
  overrideTitle, 
  overrideDescription, 
  overrideKeywords, 
  overrideImage, 
  url = '', 
  type = 'website',
  structuredData 
}) => {
  const { currentLanguage } = useLanguage();
  const pageConfig = seoConfig.pages[pageKey] || seoConfig.pages.home;
  
  const title = overrideTitle || pageConfig.title;
  const fullTitle = `${title} | ${seoConfig.siteName}`;
  const description = overrideDescription || pageConfig.description;
  const keywords = overrideKeywords || pageConfig.keywords;
  const image = overrideImage || pageConfig.ogImage || seoConfig.defaultImage;
  
  // Ensure consistent absolute URL formatting
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const metaUrl = `${seoConfig.siteUrl}${cleanUrl}`;
  const noindex = pageConfig.noindex;

  return (
    <Helmet>
      <html lang={currentLanguage} />
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#0a0a0a" />
      
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={seoConfig.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <link rel="canonical" href={metaUrl} />
      
      <link rel="alternate" href={`${seoConfig.siteUrl}/en${cleanUrl}`} hrefLang="en" />
      <link rel="alternate" href={`${seoConfig.siteUrl}/zh${cleanUrl}`} hrefLang="zh" />
      <link rel="alternate" href={`${seoConfig.siteUrl}/es${cleanUrl}`} hrefLang="es" />
      <link rel="alternate" href={`${seoConfig.siteUrl}/fr${cleanUrl}`} hrefLang="fr" />
      <link rel="alternate" href={`${seoConfig.siteUrl}/ja${cleanUrl}`} hrefLang="ja" />
      <link rel="alternate" href={`${seoConfig.siteUrl}${cleanUrl}`} hrefLang="x-default" />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHelmet;
