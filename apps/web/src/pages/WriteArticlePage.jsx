import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PenSquare, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const WriteArticlePage = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    player_name: '',
    content: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      await pb.collection('articles').create(articleData, { $autoCancel: false });
      
      toast.success(t('articles.submitSuccess'));
      setFormData({ title: '', player_name: '', content: '' });
      navigate('../my-articles');
      
    } catch (err) {
      console.error('Failed to submit article:', err);
      setError(t('articles.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHelmet 
        pageKey="write-article"
        url="/write-article"
      />

      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />

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
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
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

        <Footer />
      </div>
    </>
  );
};

export default WriteArticlePage;