// @ts-nocheck

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import { seoConfig } from '@/lib/seoConfig.js';
import { siteLanguages } from '../../../../shared/public-pages.mjs';

const SEOHelmet = ({ 
  pageKey,
  overrideTitle = '',
  overrideDescription = '',
  overrideKeywords = '',
  overrideImage = '',
  url = '', 
  type = 'website',
  structuredData = undefined,
  noindex: requestedNoindex = false,
  canonicalLanguage = '',
  alternateLanguages = siteLanguages,
}) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const pageConfig = seoConfig.pages[pageKey] || seoConfig.pages.home;
  
  const title = overrideTitle || t(`seo.${pageKey}.title`, pageConfig.title);
  const fullTitle = `${title} | ${seoConfig.siteName}`;
  const description = overrideDescription || t(`seo.${pageKey}.description`, pageConfig.description);
  const keywords = overrideKeywords || pageConfig.keywords;
  const image = overrideImage || pageConfig.ogImage || seoConfig.defaultImage;
  
  // Ensure consistent absolute URL formatting
  const path = (url.startsWith('/') ? url : `/${url}`).replace(/^\/(en|zh|ja|es|fr|de)(?=\/|$)/, '');
  const cleanUrl = path === '/' ? '' : path;
  const metaUrl = `${seoConfig.siteUrl}/${canonicalLanguage || currentLanguage}${cleanUrl}`;
  const noindex = requestedNoindex || pageConfig.noindex;

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
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      {seoConfig.twitterHandle && <meta name="twitter:site" content={seoConfig.twitterHandle} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      <link rel="canonical" href={metaUrl} />
      
      {!noindex && alternateLanguages.map(lang => <link key={lang} rel="alternate" href={`${seoConfig.siteUrl}/${lang}${cleanUrl}`} hrefLang={lang} />)}
      {!noindex && alternateLanguages.length > 0 && <link rel="alternate" href={`${seoConfig.siteUrl}/${alternateLanguages.includes('en') ? 'en' : alternateLanguages[0]}${cleanUrl}`} hrefLang="x-default" />}

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHelmet;
