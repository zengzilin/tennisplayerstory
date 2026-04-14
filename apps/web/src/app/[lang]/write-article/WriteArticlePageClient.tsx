// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PenSquare, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const localizedRouteNames: Record<string, Record<LangCode, string>> = {
  login:       { en: 'login',           zh: '登录',            ja: 'ログイン',           es: 'iniciar-sesion',    fr: 'connexion' },
  'my-articles': { en: 'my-articles',   zh: '我的文章',        ja: 'マイ記事',           es: 'mis-articulos',     fr: 'mes-articles' },
};

const WriteArticlePageClient = ({ lang }: { lang: LangCode }) => {
  const { currentUser } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    player_name: '',
    content: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push(`/${lang}/${localizedRouteNames.login[lang]}`);
    }
  }, [currentUser, lang, router]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.player_name || !formData.content) {
      setError(t('articles.allFieldsRequired'));
      return;
    }

    if (!currentUser?.id) {
      setError('Authentication error: User ID not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const articleData = {
        title: formData.title,
        player_name: formData.player_name,
        content: formData.content,
        author: currentUser.id,
        status: 'pending'
      };

      console.log('Attempting to submit article with data:', articleData);

      const record = await pb.collection('articles').create(articleData, { $autoCancel: false });

      console.log('Article successfully created:', record);

      toast.success(t('articles.submitSuccess'));
      setFormData({ title: '', player_name: '', content: '' });
      router.push(`/${lang}/${localizedRouteNames['my-articles'][lang]}`);

    } catch (err) {
      console.error('Failed to submit article. Error details:', err);
      console.error('PocketBase error response data:', err?.response?.data || err?.data);

      const pbErrorMessage = err?.response?.message || err?.message;
      if (pbErrorMessage) {
        console.error('Specific error message:', pbErrorMessage);
      }

      setError(t('articles.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <PenSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('articles.writeTitle')}</h1>
              <p className="text-muted-foreground">{t('articles.writeDesc')}</p>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>{t('articles.articleDetails')}</CardTitle>
              <CardDescription>
                {t('articles.articleDetailsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">{t('articles.articleTitle')}</Label>
                  <Input
                    id="title"
                    placeholder={t('articles.articleTitlePlaceholder')}
                    value={formData.title}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="bg-background text-foreground text-lg py-6"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="player_name">{t('articles.featuredPlayer')}</Label>
                  <Input
                    id="player_name"
                    placeholder={t('articles.featuredPlayerPlaceholder')}
                    value={formData.player_name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="bg-background text-foreground"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t('articles.featuredPlayerHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">{t('articles.articleContent')}</Label>
                  <Textarea
                    id="content"
                    placeholder={t('articles.articleContentPlaceholder')}
                    value={formData.content}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="bg-background text-foreground min-h-[300px] resize-y"
                    required
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('articles.submitting')}
                      </>
                    ) : (
                      t('articles.submitReview')
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default WriteArticlePageClient;
