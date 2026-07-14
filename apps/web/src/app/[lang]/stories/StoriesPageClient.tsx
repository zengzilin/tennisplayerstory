// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import TagFilter from '@/components/TagFilter.tsx';
import ArticlePreview from '@/components/ArticlePreview.tsx';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, PenSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStoryData } from '@/hooks/useStoryData';
import { localizeArticle } from '@/lib/localizeArticle.js';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const localizedRouteNames: Record<string, Record<LangCode, string>> = {
  stories:      { en: 'stories',           zh: '文章',            ja: '記事',               es: 'articulos',         fr: 'articles' },
  signup:       { en: 'signup',           zh: '注册',            ja: '新規登録',           es: 'registro',           fr: 'inscription' },
  'write-article': { en: 'write-article',  zh: '写文章',          ja: '記事を書く',         es: 'escribir-articulo', fr: 'ecrire-article' },
};

const StoriesPageClient = ({ lang }: { lang: LangCode }) => {
  const [selectedTag, setSelectedTag] = useState('All');

  const t = useTranslations();
  const router = useRouter();
  const { currentUser } = useAuth();

  const { stories: articles, loading, error: rawError, refetch: fetchArticles } = useStoryData();
  const localizedArticles = articles.map(article => localizeArticle(article, lang));
  const error = rawError ? t('common.error') : null;

  const handleSubmitClick = () => {
    if (currentUser) {
      router.push(`/${lang}/${localizedRouteNames['write-article'][lang]}`);
    } else {
      router.push(`/${lang}/${localizedRouteNames.signup[lang]}`);
    }
  };

  const uniqueTags = [...new Set(localizedArticles.flatMap(a => a.tags || []))].filter(Boolean).sort();

  const filteredArticles = selectedTag === 'All'
    ? localizedArticles
    : localizedArticles.filter(a => a.tags?.includes(selectedTag));

  return (
    <div className="min-h-screen flex flex-col">
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
                  <h1 className="text-4xl md:text-5xl font-bold" style={{ letterSpacing: '-0.02em' }}>
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
                      lang={lang}
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
    </div>
  );
};

export default StoriesPageClient;
