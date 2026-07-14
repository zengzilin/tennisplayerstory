// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import TagFilter from '@/components/TagFilter.tsx';
import ArticlePreview from '@/components/ArticlePreview.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, PenSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import { useStoryData } from '@/hooks/useStoryData.js';
import { generateBreadcrumbSchema, generateArticleSchema } from '@/lib/structuredData.js';
import { localizeArticle } from '@/lib/localizeArticle.js';

const StoriesPage = () => {
  const [selectedTag, setSelectedTag] = useState('All');
  
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const { stories: articles, loading, error: rawError, refetch: fetchArticles } = useStoryData();
  const localizedArticles = articles.map(article => localizeArticle(article, currentLanguage));
  const error = rawError ? t('common.error') : null;

  const handleSubmitClick = () => {
    if (currentUser) {
      navigate('../write-article');
    } else {
      navigate('../signup');
    }
  };

  const getArticleTags = (article) => (
    Array.isArray(article.tags)
      ? article.tags
      : String(article.tags || '').split(',')
  );

  const getArticleFilters = (article) => [
    ...getArticleTags(article),
    article.player_name || article.playerName,
  ].map(tag => String(tag || '').trim()).filter(Boolean);

  const uniqueTags = [...new Set(localizedArticles.flatMap(getArticleFilters))].sort((a, b) => a.localeCompare(b));

  const filteredArticles = selectedTag === 'All' 
    ? localizedArticles
    : localizedArticles.filter(article => getArticleFilters(article).includes(selectedTag));

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Stories', path: '/stories' }
  ]);

  // Add Article schema for the top displayed articles for SEO richness
  const structuredData = [
    breadcrumbs,
    ...filteredArticles.slice(0, 5).map(article => generateArticleSchema(article))
  ];

  return (
    <>
      <SEOHelmet 
        pageKey="stories"
        url="/stories"
        overrideTitle="Tennis Player Stories, Match Analysis & Fan Articles"
        overrideDescription="Read tennis player stories, match analysis, rankings context, and community articles about ATP and WTA players on TennisHub."
        overrideKeywords="tennis player stories, ATP player stories, WTA player stories, tennis match analysis, tennis fan articles, tennis rankings analysis"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <section className="py-16 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-3xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-4xl md:text-5xl font-bold">
                      {t('stories.heading')}
                    </h1>
                    {!loading && !error && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {filteredArticles.length} {t('stories.articlesCount')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-primary-foreground/90">
                    {t('stories.desc')}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={handleSubmitClick}
                  >
                    <PenSquare className="mr-2 h-5 w-5" />
                    {t('stories.submitArticle')}
                  </Button>
                </motion.div>
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {error && (
                <Alert variant="destructive" className="mb-8 max-w-3xl mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('common.error')}</AlertTitle>
                  <AlertDescription className="flex items-center justify-between mt-2">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={fetchArticles} className="bg-background text-foreground">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('common.retry')}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!loading && !error && uniqueTags.length > 0 && (
                <TagFilter 
                  tags={uniqueTags} 
                  selectedTag={selectedTag} 
                  onTagSelect={setSelectedTag} 
                  allLabel={t('stories.allTags')}
                />
              )}

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-48 w-full rounded-xl" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ))}
                </div>
              ) : !error && filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                  {filteredArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full"
                    >
                      <ArticlePreview 
                        article={article} 
                        onTagClick={setSelectedTag} 
                        labels={{
                          expand: t('stories.expand', 'Read more'),
                          hide: t('stories.hide', 'Show less'),
                          anonymous: t('stories.anonymous', 'Anonymous'),
                        }}
                        lang={currentLanguage}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : !error && (
                <div className="text-center py-24 bg-muted/30 rounded-2xl border border-border border-dashed">
                  <h3 className="text-2xl font-semibold mb-2">{t('stories.emptyTitle')}</h3>
                  <p className="text-muted-foreground">{t('stories.emptyDesc')}</p>
                  {selectedTag !== 'All' && (
                    <Button 
                      variant="outline" 
                      className="mt-6"
                      onClick={() => setSelectedTag('All')}
                    >
                      {t('stories.allTags')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default StoriesPage;
