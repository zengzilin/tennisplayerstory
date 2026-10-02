import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import CommunityNewsPage from './CommunityNewsPage.tsx';
import apiServerClient from '@/lib/apiServerClient.js';

type BriefArticle = {
  id: string;
  title: string;
  excerpt: string;
  topic: string;
  source_name: string;
  source_url: string;
  published_at: string | null;
  first_seen: string;
  updated_at: string;
};
type BriefSource = {
  id: string;
  name: string;
  homepage: string;
  last_success: string | null;
  last_error: string | null;
};
const briefOrigin = 'https://tennis-brief.zengzilin2016.workers.dev';
const topics = ['Tour news', 'Grand Slams', 'US tennis', 'Rankings'];
const fieldClass = 'min-h-11 w-full rounded border border-[#dce0d2] bg-[#fffef8] px-3 py-3 text-sm text-[#163427]';
const buttonClass = 'rounded bg-[#163427] px-5 py-3 text-sm text-white disabled:opacity-40';

function publisherLink(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && ['espn.com', 'bbc.com', 'bbc.co.uk'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
      ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export default function NewsPage() {
  const [params, setParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const community = params.get('view') === 'community' || params.has('article');
  const q = (params.get('q') || '').slice(0, 100);
  const topic = topics.includes(params.get('topic') || '') ? params.get('topic')! : '';
  const source = ['bbc', 'espn'].includes(params.get('source') || '') ? params.get('source')! : '';
  const page = Math.min(100, Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1));
  const query = new URLSearchParams({ q, topic, source, page: String(page) }).toString();
  const [articles, setArticles] = useState<BriefArticle[]>([]);
  const [sources, setSources] = useState<BriefSource[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (community) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setExpanded(null);
    async function load(): Promise<void> {
      try {
        const response = await apiServerClient.fetch(`/news/brief/articles?${query}`, { signal: controller.signal });
        if (!response.ok) throw new Error('News unavailable');
        const data = await response.json();
        if (!controller.signal.aborted) {
          setArticles(data.articles);
          setHasMore(data.has_more);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [community, query, retry]);

  useEffect(() => {
    if (community) return;
    const controller = new AbortController();
    setStatusError(false);
    async function loadStatus(): Promise<void> {
      try {
        const response = await apiServerClient.fetch('/news/brief/status', { signal: controller.signal });
        if (!response.ok) throw new Error('Status unavailable');
        const data = await response.json();
        if (!controller.signal.aborted) setSources(data.sources);
      } catch {
        if (!controller.signal.aborted) setStatusError(true);
      }
    }
    void loadStatus();
    return () => controller.abort();
  }, [community, retry]);

  function search(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ['q', 'topic', 'source']) {
      const value = String(data.get(key) || '').trim();
      if (value) next.set(key, value);
    }
    setParams(next);
  }

  function changePage(nextPage: number): void {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
  }

  function formatDate(value: string | null): string {
    if (!value || Number.isNaN(Date.parse(value))) return t('brief.noDate');
    return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
  }

  if (community) return <CommunityNewsPage />;

  return (
    <>
      <SEOHelmet pageKey="news" url="/news" overrideTitle={t('brief.seoTitle')} overrideDescription={t('brief.description')} overrideKeywords="tennis news, Tennis Brief, ESPN tennis, BBC tennis, RSS headlines" overrideImage={undefined} structuredData={undefined} />
      <div className="flex min-h-screen flex-col bg-[#f5f5ec] text-[#163427] [&_a]:underline-offset-4 [&_a:focus-visible]:outline [&_a:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline [&_button:focus-visible]:outline-offset-4">
        <Header />
        <main id="main-content" className="mx-auto w-full max-w-[1200px] flex-1 px-5 sm:px-8 [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <nav aria-label={t('brief.sections')} className="flex flex-wrap gap-5 border-b border-[#dce0d2] py-5 text-sm">
            <span className="font-bold" aria-current="page">Tennis Brief</span>
            <button type="button" onClick={() => setParams({ view: 'community' })} className="underline">{t('brief.community')}</button>
            <a href="#news-sources" className="underline">{t('brief.sourcesPolicy')}</a>
          </nav>
          <section className="border-b border-[#dce0d2] py-12 sm:py-16">
            <p className="text-[11px] font-bold tracking-[0.25em]">{t('brief.eyebrow')}</p>
            <h1 className="my-5 text-5xl font-extrabold leading-[1.04] tracking-[-2px] sm:text-7xl lg:text-[80px]">{t('brief.headingLine1')}<br />{t('brief.headingLine2')}<span className="text-[#88a829]">.</span></h1>
            <p className="max-w-xl text-base leading-7 text-[#647266] sm:text-lg">{t('brief.description')}</p>
            <span className="mt-6 inline-block rounded-full border border-[#bac6ac] px-4 py-2 text-xs">{t('brief.cadence')}</span>
          </section>
          <section className="py-8" aria-busy={loading}>
            <div className="flex items-start justify-between gap-5 sm:items-center">
              <h2 className="text-2xl font-bold tracking-tight">{t('brief.latest')}</h2>
              <a href={`${briefOrigin}/feed.xml`} className="text-xs underline">{t('brief.subscribe')} ↗</a>
            </div>
            <form key={query} onSubmit={search} className="my-6 flex flex-wrap items-end gap-3">
              <label className="basis-full text-xs sm:flex-1">{t('brief.search')}<input name="q" defaultValue={q} maxLength={100} placeholder={t('brief.placeholder')} className={`mt-2 ${fieldClass}`} /></label>
              <label className="min-w-36 flex-1 text-xs sm:flex-none">{t('brief.topic')}<select name="topic" defaultValue={topic} className={`mt-2 ${fieldClass}`}><option value="">{t('brief.allTopics')}</option>{topics.map((item, index) => <option key={item} value={item}>{t(`brief.topics.${index}`)}</option>)}</select></label>
              <label className="min-w-36 flex-1 text-xs sm:flex-none">{t('brief.source')}<select name="source" defaultValue={source} className={`mt-2 ${fieldClass}`}><option value="">{t('brief.allSources')}</option><option value="bbc">BBC Sport</option><option value="espn">ESPN</option></select></label>
              <button className={buttonClass} type="submit">{t('brief.find')}</button>
              <button className="px-2 py-3 text-sm underline" type="button" onClick={() => setParams({})}>{t('brief.reset')}</button>
            </form>
            <div aria-live="polite">
              {loading ? <p className="py-12 text-center">{t('brief.loading')}</p> : error ? (
                <div role="alert" className="rounded border border-[#dce0d2] p-8 text-center"><p className="mb-4">{t('brief.error')}</p><button type="button" className={buttonClass} onClick={() => setRetry(value => value + 1)}>{t('brief.retry')}</button></div>
              ) : articles.length === 0 ? (
                <div className="border border-dashed border-[#bac6ac] bg-[#f0f2e5] p-12 text-center"><h3 className="text-2xl font-bold">{t(q || topic || source ? 'brief.noMatches' : 'brief.empty')}</h3><p className="mt-3 text-sm">{t(q || topic || source ? 'brief.tryFilters' : 'brief.awaiting')}</p></div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map(article => <article key={article.id} lang="en" className="flex flex-col rounded-lg border border-[#dce0d2] bg-[#fffef8] p-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#637d3c]">{article.topic}</span>
                    <h3 className="my-4 text-xl font-bold leading-snug"><a href={publisherLink(article.source_url)} rel="noopener noreferrer" className="hover:underline">{article.title}</a></h3>
                    <p className="mb-5 text-sm leading-6 text-[#647266]">{article.excerpt}</p>
                    <div className="mt-auto border-t border-[#dce0d2] pt-4 text-xs text-[#647266]">{t('brief.providedBy')} {article.source_name} · <time dateTime={article.published_at || undefined}>{formatDate(article.published_at)}</time></div>
                    <div className="mt-3 flex justify-between gap-3 text-xs"><a href={publisherLink(article.source_url)} rel="noopener noreferrer" className="underline">{t('brief.readOriginal')} ↗</a><button type="button" aria-expanded={expanded === article.id} aria-controls={`details-${article.id}`} onClick={() => setExpanded(value => value === article.id ? null : article.id)} className="underline">{t('brief.details')} →</button></div>
                    {expanded === article.id && <div id={`details-${article.id}`} className="mt-5 space-y-2 border-t border-[#dce0d2] pt-4 text-xs leading-5 text-[#647266]"><p>{t('brief.collected')}: {formatDate(article.first_seen)}</p><p>{t('brief.changed')}: {formatDate(article.updated_at)}</p><p>{t('brief.excerptPolicy')}</p><a className="inline-block underline" href={`${briefOrigin}/brief/${article.id}.md`}>Markdown ↗</a></div>}
                  </article>)}
                </div>
              )}
            </div>
            {!loading && !error && <nav aria-label={t('brief.pagination')} className="mt-8 flex items-center justify-center gap-6 text-sm"><button type="button" disabled={page <= 1} className="underline disabled:opacity-40" onClick={() => changePage(page - 1)}>← {t('brief.previous')}</button><span>{t('brief.page', { page })}</span><button type="button" disabled={!hasMore || page >= 100} className="underline disabled:opacity-40" onClick={() => changePage(page + 1)}>{t('brief.next')} →</button></nav>}
          </section>
          <section id="news-sources" className="mb-12 mt-3 scroll-mt-20 rounded-lg bg-[#e9edde] p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">{t('brief.sourceHeading')}</h2>
            {statusError ? <div role="status" className="mt-4 text-sm"><p>{t('brief.statusError')}</p><button className="mt-2 underline" type="button" onClick={() => setRetry(value => value + 1)}>{t('brief.retry')}</button></div> : <div className="mt-5 grid gap-6 sm:grid-cols-2">{sources.map(item => <div key={item.id}><strong>{item.name}</strong><span className={`ml-3 inline-block rounded-full px-3 py-1 text-[10px] ${item.last_error ? 'bg-[#f4dfb8]' : 'bg-[#d9e5c3]'}`}>{t(item.last_error ? 'brief.failed' : item.last_success ? 'brief.connected' : 'brief.pending')}</span><p className="my-3 text-xs">{t('brief.lastCheck')}: {formatDate(item.last_success)}</p>{item.last_error && <p className="mb-3 text-xs">{t('brief.stale')}</p>}<a className="text-xs underline" href={publisherLink(item.homepage)} rel="noopener noreferrer">{t('brief.visit')} ↗</a></div>)}</div>}
            <p className="mt-6 text-xs leading-6 text-[#647266]">{t('brief.policy')}</p>
            <a href={`${briefOrigin}/about`} className="text-xs underline">{t('brief.sourcesPolicy')} ↗</a>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
