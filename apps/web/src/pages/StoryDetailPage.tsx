// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbaseClient';
import { localizeArticle } from '@/lib/localizeArticle';
import { SUPPORT_EMAIL, SITE_ORIGIN, validStoryId, storyPath, storyAuthor, storySource } from '../../../../shared/site-info.mjs';
import { articleLanguages, articleCanonicalLanguage } from '../../../../shared/article-seo.mjs';

export default function StoryDetailPage() {
  const { id } = useParams();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const text = key => t(`storyDetail.${key}`);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setArticle(null);
    if (!validStoryId(id)) { setLoading(false); return; }
    pb.collection('articles').getList(1, 1, { filter: pb.filter('status="approved" && id={:id}', { id }), expand: 'author', $autoCancel: false })
      .then(result => { if (!cancelled) setArticle(result.items[0] || null); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, attempt]);
  const localized = article && localizeArticle(article, currentLanguage);
  const canonicalLanguage = article && articleCanonicalLanguage(article, currentLanguage);
  const author = article && storyAuthor(article, text('contributor'));
  const source = article && storySource(article);
  const formatDate = date => date && !Number.isNaN(Date.parse(date)) ? new Date(date).toLocaleDateString(currentLanguage, { year: 'numeric', month: 'long', day: 'numeric' }) : null;
  const published = article && formatDate(article.created);
  const updated = article && formatDate(article.updated);
  const schema = localized ? {
    '@context': 'https://schema.org', '@type': 'Article', headline: localized.title,
    description: localized.meta_description || localized.content.slice(0, 160),
    author: { '@type': 'Person', name: author }, publisher: { '@type': 'Organization', name: 'TennisHub', url: SITE_ORIGIN },
    mainEntityOfPage: `${SITE_ORIGIN}${storyPath(canonicalLanguage, id)}`,
    ...(published ? { datePublished: article.created } : {}), ...(updated ? { dateModified: article.updated } : {}),
  } : null;
  return <div className="min-h-screen flex flex-col bg-background">
    <SEOHelmet pageKey="stories" url={`/stories/${encodeURIComponent(id || '')}`} canonicalLanguage={canonicalLanguage} alternateLanguages={article ? articleLanguages(article) : []} overrideTitle={localized?.title || (loading ? t('common.loading', 'Loading…') : text(error ? 'error' : 'missing'))} overrideDescription={localized?.meta_description || localized?.content?.slice(0, 160)} type="article" structuredData={schema} noindex={!loading && !article} />
    <Header />
    <main id="main-content" className="flex-1 container mx-auto px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <Link to={`/${currentLanguage}/stories`} className="text-sm text-primary hover:underline">← {text('back')}</Link>
        {loading ? <p className="py-12" role="status">{t('common.loading', 'Loading…')}</p> : error ? <div className="py-12" role="alert"><p>{text('error')}</p><Button className="mt-4" onClick={() => setAttempt(value => value + 1)}>{text('retry')}</Button></div> : !localized ? <h1 className="text-2xl font-bold py-12">{text('missing')}</h1> : <article className="mt-6">
          <p className="text-xs text-muted-foreground mb-3">{text(article.trend_source ? 'automated' : 'community')}</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif leading-tight break-words mb-5">{localized.title}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground border-b pb-5 mb-8">
            <span>{text('author')}：{author}</span>
            {published && <span>{text('date')} <time dateTime={article.created}>{published}</time></span>}
            {updated && updated !== published && <span>{text('updated')} <time dateTime={article.updated}>{updated}</time></span>}
          </div>
          <div className="space-y-6 text-lg leading-8 break-words" lang={canonicalLanguage}>
            {String(localized.content || '').split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index} className="whitespace-pre-wrap">{paragraph}</p>)}
          </div>
          {source && <aside className="mt-8 rounded-xl bg-muted/40 p-5"><h2 className="font-semibold mb-2">{text('source')}</h2><a className="text-primary underline break-all" href={source} target="_blank" rel="noopener noreferrer">{new URL(source).hostname}</a></aside>}
          <p className="mt-8 text-sm"><a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(localized.title)}&body=${encodeURIComponent(`${SITE_ORIGIN}${storyPath(currentLanguage, id)}`)}`}>{text('correction')}</a></p>
        </article>}
      </div>
    </main>
    <Footer />
  </div>;
}
