// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { usePlayerData } from '@/hooks/usePlayerData.js';
import pb from '@/lib/pocketbaseClient';
import PlayerCard from '@/components/PlayerCard.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, Mail, MapPin, LogOut, Loader2, Settings, FileText, Pencil, Trash2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const localizedRouteNames: Record<string, Record<LangCode, string>> = {
  login:           { en: 'login',           zh: '登录',            ja: 'ログイン',           es: 'iniciar-sesion',    fr: 'connexion' },
  'write-article': { en: 'write-article',   zh: '写文章',          ja: '記事を書く',         es: 'escribir-articulo', fr: 'ecrire-article' },
  players:         { en: 'players',         zh: '球员',            ja: 'プレイヤー',         es: 'jugadores',         fr: 'joueurs' },
};

const ProfilePageClient = ({ lang }: { lang: LangCode }) => {
  const { currentUser, logout, updateUser } = useAuth();
  const { players, loading: playersLoading } = usePlayerData();
  const t = useTranslations();
  const router = useRouter();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    country: currentUser?.country || '',
    bio: currentUser?.bio || ''
  });

  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState(null);

  const [editingArticle, setEditingArticle] = useState(null);
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [isProcessingArticle, setIsProcessingArticle] = useState(false);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    tags: ''
  });

  useEffect(() => {
    if (!currentUser) {
      router.push(`/${lang}/${localizedRouteNames.login[lang]}`);
      return;
    }
  }, [currentUser, lang, router]);

  const favoritePlayerIds = currentUser?.favorite_players || [];
  const favoritePlayers = players.filter(p => favoritePlayerIds.includes(p.id));

  const avatarUrl = currentUser?.avatar
    ? pb.files.getUrl(currentUser, currentUser.avatar)
    : null;

  const fetchMyArticles = async () => {
    if (!currentUser) return;
    setArticlesLoading(true);
    setArticlesError(null);
    try {
      const result = await pb.collection('articles').getList(1, 50, {
        filter: `author = "${currentUser.id}"`,
        sort: '-created_at',
        $autoCancel: false
      });
      setArticles(result.items);
    } catch (err) {
      console.error('Error fetching user articles:', err);
      setArticlesError(t('common.error'));
    } finally {
      setArticlesLoading(false);
    }
  };

  useEffect(() => {
    fetchMyArticles();
  }, [currentUser]);

  const handleProfileChange = (e) => {
    const { id, value } = e.target;
    setProfileForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    try {
      await updateUser(currentUser.id, profileForm);
      toast.success(t('common.success'));
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('common.error'));
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const openEditArticle = (article) => {
    setArticleForm({
      title: article.title || '',
      content: article.content || '',
      tags: (article.tags || []).join(', ')
    });
    setEditingArticle(article);
  };

  const handleEditArticleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessingArticle(true);
    try {
      const tagsArray = articleForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const updateData = {
        title: articleForm.title,
        content: articleForm.content,
        tags: tagsArray
      };

      await pb.collection('articles').update(editingArticle.id, updateData, { $autoCancel: false });
      toast.success(t('common.success'));
      setEditingArticle(null);
      fetchMyArticles();
    } catch (err) {
      console.error('Error updating article:', err);
      toast.error(t('common.error'));
    } finally {
      setIsProcessingArticle(false);
    }
  };

  const handleDeleteArticleConfirm = async () => {
    if (!deletingArticle) return;
    setIsProcessingArticle(true);
    try {
      await pb.collection('articles').delete(deletingArticle.id, { $autoCancel: false });
      toast.success(t('common.success'));
      setDeletingArticle(null);
      fetchMyArticles();
    } catch (err) {
      console.error('Error deleting article:', err);
      toast.error(t('common.error'));
    } finally {
      setIsProcessingArticle(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">{t('admin.status.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">{t('admin.status.rejected')}</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">{t('admin.status.pending')}</Badge>;
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-border shadow-sm overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-primary to-accent"></div>
              <CardContent className="relative pt-0 pb-8 px-6 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                    <div className="h-24 w-24 rounded-full bg-background border-4 border-background flex items-center justify-center shadow-md overflow-hidden shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={currentUser?.name || 'Avatar'} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="pb-2 space-y-1">
                      <h1 className="text-3xl font-bold">{currentUser?.name || t('nav.profile')}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4" />
                          {currentUser?.email}
                        </span>
                        {currentUser?.country && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {currentUser.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pb-2">
                    <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          {t('profile.editProfile')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleSaveProfile}>
                          <DialogHeader>
                            <DialogTitle>{t('profile.editProfile')}</DialogTitle>
                            <DialogDescription>
                              {t('profile.editDesc')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">{t('common.name')}</Label>
                              <Input
                                id="name"
                                value={profileForm.name}
                                onChange={handleProfileChange}
                                className="bg-background text-foreground"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country">{t('common.country')}</Label>
                              <Input
                                id="country"
                                value={profileForm.country}
                                onChange={handleProfileChange}
                                className="bg-background text-foreground"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bio">{t('profile.bio')}</Label>
                              <Textarea
                                id="bio"
                                value={profileForm.bio}
                                onChange={handleProfileChange}
                                placeholder={t('profile.bioPlaceholder')}
                                className="bg-background text-foreground resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)} disabled={isSubmittingProfile}>
                              {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmittingProfile}>
                              {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {t('profile.saveChanges')}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button variant="destructive" onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.logout')}
                    </Button>
                  </div>
                </div>

                {currentUser?.bio && (
                  <div className="mt-6 p-4 bg-muted/40 rounded-lg border border-border/50">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {currentUser.bio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Tabs defaultValue="articles" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                <TabsTrigger value="articles" className="text-base">{t('profile.myArticles')}</TabsTrigger>
                <TabsTrigger value="favorites" className="text-base">{t('profile.favPlayers')}</TabsTrigger>
              </TabsList>

              <TabsContent value="articles" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{t('profile.myArticles')}</h2>
                  <Button onClick={() => router.push(`/${lang}/${localizedRouteNames['write-article'][lang]}`)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('profile.writeArticle')}
                  </Button>
                </div>

                {articlesError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('common.error')}</AlertTitle>
                    <AlertDescription className="flex items-center justify-between mt-2">
                      <span>{articlesError}</span>
                      <Button variant="outline" size="sm" onClick={fetchMyArticles} className="bg-background text-foreground">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('common.retry')}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {articlesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardHeader className="pb-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/4" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-8 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : articles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                      <Card key={article.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-4">
                            <CardTitle className="text-xl line-clamp-2 leading-tight">
                              {article.title}
                            </CardTitle>
                            {getStatusBadge(article.status)}
                          </div>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <span>{formatDate(article.created_at || article.created)}</span>
                            {article.player_name && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-foreground/80">{article.player_name}</span>
                              </>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                            {article.content}
                          </p>
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {article.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {article.status === 'rejected' && article.rejection_reason && (
                            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                              <span className="font-semibold block mb-1">{t('articles.rejectionReason')}</span>
                              {article.rejection_reason}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0 mt-auto border-t border-border/50 bg-muted/10 p-4 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditArticle(article)}
                            className="bg-background"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingArticle(article)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 bg-background"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete')}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{t('profile.noArticlesTitle')}</h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        {t('profile.noArticlesDesc')}
                      </p>
                      <Button onClick={() => router.push(`/${lang}/${localizedRouteNames['write-article'][lang]}`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('profile.writeArticle')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="favorites" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{t('profile.favPlayers')}</h2>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                    {favoritePlayers.length} {t('profile.saved')}
                  </span>
                </div>

                {playersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : favoritePlayers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoritePlayers.map((player) => (
                      <PlayerCard key={player.id} player={player} lang={lang} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{t('profile.noFavsTitle')}</h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        {t('profile.noFavsDesc')}
                      </p>
                      <Button onClick={() => router.push(`/${lang}/${localizedRouteNames.players[lang]}`)}>
                        {t('profile.browsePlayers')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>

        </div>
      </main>

      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditArticleSubmit}>
            <DialogHeader>
              <DialogTitle>{t('profile.editArticle')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="article-title">{t('profile.articleTitle')}</Label>
                <Input
                  id="article-title"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                  required
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-tags">{t('profile.articleTags')}</Label>
                <Input
                  id="article-tags"
                  value={articleForm.tags}
                  onChange={(e) => setArticleForm({...articleForm, tags: e.target.value})}
                  placeholder="e.g. Grand Slam, ATP, Final"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-content">{t('profile.articleContent')}</Label>
                <Textarea
                  id="article-content"
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                  className="min-h-[200px] bg-background text-foreground"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingArticle(null)}
                disabled={isProcessingArticle}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isProcessingArticle}
              >
                {isProcessingArticle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingArticle} onOpenChange={(open) => !open && setDeletingArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingArticle}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArticleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessingArticle}
            >
              {isProcessingArticle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilePageClient;
