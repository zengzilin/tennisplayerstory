// @ts-nocheck

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Newspaper,
  PenSquare,
  Radio,
  RefreshCw,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import { useStoryData } from '@/hooks/useStoryData.js';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/structuredData.js';

const categoryRules = [
  { key: 'all', terms: [] },
  { key: 'players', terms: ['球员', 'player', '选手', 'atp', 'wta'] },
  { key: 'matches', terms: ['比赛', '赛事', '赛果', 'match', 'tournament', '决赛'] },
  { key: 'atp', terms: ['atp', '男子'] },
  { key: 'wta', terms: ['wta', '女子'] },
  { key: 'grandSlams', terms: ['大满贯', '温网', '法网', '美网', '澳网', 'grand slam', 'wimbledon'] },
];

const localeMap = {
  zh: 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
};

const getTags = (article) => (
  Array.isArray(article.tags)
    ? article.tags.map(String).filter(Boolean)
    : String(article.tags || '').split(',').map(tag => tag.trim()).filter(Boolean)
);

const getPlayerName = (article) => article.player_name || article.playerName || '';
const getCreatedAt = (article) => article.publishedAt || article.created || article.createdAt || article.created_at;

const getArticleSearchText = (article) => [
  article.title,
  article.content,
  article.excerpt,
  getPlayerName(article),
  ...getTags(article),
].join(' ').toLowerCase();

const getExcerpt = (article, length = 150) => {
  const source = String(article.excerpt || article.meta_description || article.content || '')
    .replace(/\s+/g, ' ')
    .trim();
  return source.length > length ? `${source.slice(0, length).trim()}…` : source;
};

const CommunityNewsPage = () => {
  const [, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedArticleId, setExpandedArticleId] = useState(null);
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { stories: articles, loading, error, refetch } = useStoryData();
  const locale = localeMap[currentLanguage] || 'en-US';

  const categories = categoryRules.map(category => ({
    ...category,
    label: t(`news.categories.${category.key}`, category.key),
  }));

  const filteredArticles = useMemo(() => {
    const activeRule = categoryRules.find(category => category.key === selectedCategory);
    if (!activeRule || activeRule.terms.length === 0) return articles;
    return articles.filter(article => {
      const searchText = getArticleSearchText(article);
      return activeRule.terms.some(term => searchText.includes(term));
    });
  }, [articles, selectedCategory]);

  const featuredArticle = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1, 3);
  const latestArticles = filteredArticles.slice(3);

  const trendingTags = useMemo(() => {
    const counts = new Map();
    articles.forEach(article => getTags(article).forEach(tag => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
  }, [articles]);

  const followedPlayers = useMemo(() => {
    const counts = new Map();
    articles.forEach(article => {
      const player = getPlayerName(article);
      if (player && player.toLowerCase() !== 'google trends') {
        counts.set(player, (counts.get(player) || 0) + 1);
      }
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [articles]);

  const formatDate = (value, dateStyle = 'medium') => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, { dateStyle }).format(date);
  };

  const handleWriteArticle = () => {
    navigate(currentUser ? '../write-article' : '../signup');
  };

  const toggleArticle = (articleId) => {
    setExpandedArticleId(current => current === articleId ? null : articleId);
  };

  const structuredData = [
    generateBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Tennis News', path: '/news' },
    ]),
    ...filteredArticles.slice(0, 5).map(article => generateArticleSchema(article, currentLanguage)),
  ];

  return (
    <>
      <SEOHelmet
        pageKey="news"
        url="/stories"
        overrideTitle={t('news.seoTitle', 'Latest Tennis News, Player Updates & Match Reports')}
        overrideDescription={t('news.seoDescription', 'Follow the latest ATP and WTA tennis news, player updates, tournament reports, match analysis, and Grand Slam stories.')}
        overrideKeywords="tennis news, ATP news, WTA news, tennis player updates, tournament news, match reports, Grand Slam news"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col">
        <Header />
        <nav aria-label={t('brief.sections')} className="container mx-auto flex gap-5 px-6 py-4 text-sm">
          <button type="button" onClick={() => setSearchParams({})} className="underline">Tennis Brief</button>
          <span className="font-bold" aria-current="page">{t('brief.community')}</span>
        </nav>

        {!loading && !error && articles.length > 0 && (
          <div className="bg-slate-950 text-white border-b border-white/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center gap-4 overflow-hidden">
              <div className="shrink-0 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-lime-300">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                {t('news.breaking', 'Top story')}
              </div>
              <div className="h-4 w-px bg-white/20 shrink-0" />
              <p className="truncate text-sm text-slate-200">{articles[0].title}</p>
              <span className="ml-auto hidden sm:inline text-xs text-slate-400 shrink-0">
                {formatDate(getCreatedAt(articles[0]))}
              </span>
            </div>
          </div>
        )}

        <main id="main-content" className="flex-1">
          <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-card dark:bg-slate-900">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(132,204,22,0.12),transparent_65%)]" />
            <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-300/50 bg-lime-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-lime-800 dark:border-lime-500/30 dark:bg-lime-500/10 dark:text-lime-300">
                    <Activity className="h-3.5 w-3.5" />
                    ATP · WTA · GRAND SLAM
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                    {t('news.heading', 'Tennis Newsroom')}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                    {t('news.description', 'Player updates, tournament reports, match analysis, and the stories shaping professional tennis.')}
                  </p>
                </div>
                <Button onClick={handleWriteArticle} className="w-fit rounded-full bg-slate-950 px-6 text-white hover:bg-lime-600 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300">
                  <PenSquare className="mr-2 h-4 w-4" />
                  {t('news.submitArticle', 'Publish an article')}
                </Button>
              </div>
            </div>
          </section>

          <section className="sticky top-20 z-30 border-b border-slate-200 bg-card/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
              <div className="flex min-w-max items-center gap-2 py-3">
                {categories.map(category => (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setSelectedCategory(category.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      selectedCategory === category.key
                        ? 'bg-slate-950 text-white dark:bg-lime-400 dark:text-slate-950'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {error && (
              <Alert variant="destructive" className="mb-8">
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription className="mt-2 flex items-center justify-between gap-4">
                  <span>{t('news.loadError', 'The newsroom could not be loaded.')}</span>
                  <Button variant="outline" size="sm" onClick={refetch}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('common.retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="grid gap-6 lg:grid-cols-12">
                <Skeleton className="h-[430px] rounded-3xl lg:col-span-8" />
                <Skeleton className="h-[430px] rounded-3xl lg:col-span-4" />
              </div>
            ) : !error && featuredArticle ? (
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="space-y-10 lg:col-span-8">
                  <section aria-labelledby="lead-story-heading" className="grid gap-4 md:grid-cols-5">
                    <motion.article
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative min-h-[390px] overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:col-span-3 sm:p-9"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(163,230,53,0.33),transparent_32%),linear-gradient(145deg,transparent_20%,rgba(15,23,42,0.65))]" />
                      <Trophy className="absolute -bottom-12 -right-8 h-64 w-64 rotate-12 text-white/[0.06]" />
                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between gap-4">
                          <Badge className="border-0 bg-lime-400 text-slate-950 hover:bg-lime-400">
                            {t('news.leadStory', 'Lead story')}
                          </Badge>
                          <time className="flex items-center gap-1.5 text-xs text-slate-300" dateTime={getCreatedAt(featuredArticle)}>
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(getCreatedAt(featuredArticle))}
                          </time>
                        </div>
                        <div className="mt-auto pt-20">
                          {getPlayerName(featuredArticle) && (
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-lime-300">
                              {getPlayerName(featuredArticle)}
                            </p>
                          )}
                          <h2 id="lead-story-heading" className="text-3xl font-black leading-tight sm:text-4xl">
                            {featuredArticle.title}
                          </h2>
                          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-300 sm:text-base">
                            {getExcerpt(featuredArticle, 190)}
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleArticle(featuredArticle.id)}
                            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-lime-300 hover:text-lime-200"
                          >
                            {expandedArticleId === featuredArticle.id ? t('news.collapse', 'Close article') : t('news.readFull', 'Read full story')}
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.article>

                    <div className="grid gap-4 md:col-span-2">
                      {secondaryArticles.map((article, index) => (
                        <motion.article
                          key={article.id}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="group flex min-h-[185px] flex-col rounded-3xl border border-slate-200 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-bold uppercase tracking-[0.14em] text-lime-700 dark:text-lime-400">
                              {getPlayerName(article) || getTags(article)[0] || t('news.latest', 'Latest')}
                            </span>
                            <time>{formatDate(getCreatedAt(article), 'short')}</time>
                          </div>
                          <h3 className="mt-4 line-clamp-3 text-xl font-black leading-snug text-slate-950 group-hover:text-lime-700 dark:text-white dark:group-hover:text-lime-400">
                            {article.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => toggleArticle(article.id)}
                            className="mt-auto pt-4 inline-flex items-center gap-1 text-left text-sm font-semibold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                          >
                            {t('news.readFull', 'Read full story')} <ChevronRight className="h-4 w-4" />
                          </button>
                        </motion.article>
                      ))}
                    </div>
                  </section>

                  {expandedArticleId && filteredArticles.find(article => article.id === expandedArticleId) && (
                    <motion.article
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl border border-lime-200 bg-card p-6 shadow-sm dark:border-lime-900/60 dark:bg-slate-900 sm:p-9"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                          {filteredArticles.find(article => article.id === expandedArticleId).title}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => setExpandedArticleId(null)}>
                          {t('news.collapse', 'Close article')}
                        </Button>
                      </div>
                      <div className="mt-6 whitespace-pre-wrap text-base leading-8 text-slate-700 dark:text-slate-300">
                        {filteredArticles.find(article => article.id === expandedArticleId).content}
                      </div>
                    </motion.article>
                  )}

                  {latestArticles.length > 0 && (
                    <section aria-labelledby="latest-news-heading">
                      <div className="mb-5 flex items-end justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700 dark:text-lime-400">
                            {t('news.newsDesk', 'News desk')}
                          </p>
                          <h2 id="latest-news-heading" className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
                            {t('news.latestNews', 'Latest tennis news')}
                          </h2>
                        </div>
                        <span className="text-sm text-slate-500">{filteredArticles.length} {t('news.articles', 'articles')}</span>
                      </div>

                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {latestArticles.map((article, index) => (
                          <motion.article
                            key={article.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.04, 0.24) }}
                            className="group grid gap-5 py-6 sm:grid-cols-[128px_1fr]"
                          >
                            <div className="relative hidden min-h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-lime-700 sm:flex sm:items-center sm:justify-center">
                              <Newspaper className="h-10 w-10 text-white/80" />
                              <span className="absolute bottom-2 right-3 text-4xl font-black text-white/10">{String(index + 1).padStart(2, '0')}</span>
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-bold uppercase tracking-[0.12em] text-lime-700 dark:text-lime-400">
                                  {getPlayerName(article) || getTags(article)[0] || t('news.latest', 'Latest')}
                                </span>
                                <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(getCreatedAt(article))}</span>
                              </div>
                              <h3 className="mt-2 text-xl font-black leading-snug text-slate-950 group-hover:text-lime-700 dark:text-white dark:group-hover:text-lime-400 sm:text-2xl">
                                {article.title}
                              </h3>
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                                {getExcerpt(article)}
                              </p>
                              <button
                                type="button"
                                onClick={() => toggleArticle(article.id)}
                                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-lime-700 dark:text-white dark:hover:text-lime-400"
                              >
                                {t('news.readFull', 'Read full story')} <ArrowRight className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <aside className="space-y-6 lg:col-span-4">
                  <section className="rounded-3xl border border-slate-200 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-100 text-lime-800 dark:bg-lime-400/10 dark:text-lime-300">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{t('news.now', 'Now')}</p>
                        <h2 className="text-xl font-black text-slate-950 dark:text-white">{t('news.trendingTopics', 'Trending topics')}</h2>
                      </div>
                    </div>
                    <ol className="mt-5 space-y-1">
                      {trendingTags.map(([tag, count], index) => (
                        <li key={tag}>
                          <button
                            type="button"
                            onClick={() => {
                              const matchingCategory = categoryRules.find(category => category.terms.some(term => tag.toLowerCase().includes(term)));
                              setSelectedCategory(matchingCategory?.key || 'all');
                            }}
                            className="flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <span className="w-6 text-lg font-black text-slate-300 dark:text-slate-600">{index + 1}</span>
                            <span className="flex-1 font-semibold text-slate-800 dark:text-slate-200">{tag}</span>
                            <Badge variant="secondary" className="rounded-full">{count}</Badge>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </section>

                  {followedPlayers.length > 0 && (
                    <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
                      <div className="flex items-center gap-3">
                        <UserRound className="h-5 w-5 text-lime-300" />
                        <h2 className="text-xl font-black">{t('news.playersInFocus', 'Players in focus')}</h2>
                      </div>
                      <div className="mt-5 grid gap-3">
                        {followedPlayers.map(([player, count], index) => (
                          <div key={player} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-400 font-black text-slate-950">{index + 1}</span>
                            <span className="flex-1 font-semibold">{player}</span>
                            <span className="text-xs text-slate-400">{count} {t('news.articles', 'articles')}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="rounded-3xl border border-slate-200 bg-card p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">{t('news.quickLinks', 'Quick court links')}</h2>
                    <div className="mt-4 grid gap-3">
                      {[
                        { label: t('nav.liveMatches', 'Live matches'), path: '../live-matches', icon: Radio },
                        { label: t('nav.rankings', 'Rankings'), path: '../rankings', icon: Trophy },
                        { label: t('nav.players', 'Players'), path: '../players', icon: UserRound },
                      ].map(item => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => navigate(item.path)}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left font-semibold text-slate-800 transition-colors hover:border-lime-400 hover:bg-lime-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-lime-500 dark:hover:bg-lime-400/5"
                        >
                          <item.icon className="h-4 w-4 text-lime-700 dark:text-lime-400" />
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </section>
                </aside>
              </div>
            ) : !error && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-card py-24 text-center dark:border-slate-700 dark:bg-slate-900">
                <Newspaper className="mx-auto h-12 w-12 text-slate-300" />
                <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">{t('news.emptyTitle', 'No news in this category')}</h2>
                <p className="mt-2 text-slate-500">{t('news.emptyDescription', 'Fresh tennis reports will appear here as soon as they are published.')}</p>
                {selectedCategory !== 'all' && (
                  <Button variant="outline" className="mt-6" onClick={() => setSelectedCategory('all')}>
                    {t('news.showAll', 'Show all news')}
                  </Button>
                )}
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CommunityNewsPage;
