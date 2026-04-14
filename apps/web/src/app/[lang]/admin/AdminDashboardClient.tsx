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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Loader2, AlertCircle, RefreshCw, FileText, Pencil, Trash2, Plus, Users, Database, Settings, Activity } from 'lucide-react';
import { toast } from 'sonner';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const localizedRouteNames: Record<string, Record<LangCode, string>> = {
  login:           { en: 'login',           zh: '登录',            ja: 'ログイン',           es: 'iniciar-sesion',    fr: 'connexion' },
  'admin/players': { en: 'admin/players',   zh: 'admin/players',   ja: 'admin/players',      es: 'admin/players',       fr: 'admin/players' },
  'admin/scraping': { en: 'admin/scraping', zh: 'admin/scraping', ja: 'admin/scraping',     es: 'admin/scraping',     fr: 'admin/scraping' },
  'write-article': { en: 'write-article',  zh: '写文章',          ja: '記事を書く',         es: 'escribir-articulo', fr: 'ecrire-article' },
};

const AdminDashboardClient = ({ lang }: { lang: LangCode }) => {
  const { currentUser } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingArticle, setEditingArticle] = useState(null);
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalArticles: 0,
    pendingArticles: 0
  });

  const [editForm, setEditForm] = useState({
    title: '',
    player_name: '',
    content: '',
    tags: '',
    status: 'pending'
  });

  useEffect(() => {
    if (!currentUser) {
      router.push(`/${lang}/${localizedRouteNames.login[lang]}`);
    } else if (currentUser.role !== 'admin') {
      router.push(`/${lang}`);
      toast.error(t('common.unauthorized'));
    }
  }, [currentUser, lang, router, t]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const articlesResult = await pb.collection('articles').getList(1, 50, {
        sort: '-created',
        expand: 'author',
        $autoCancel: false
      });
      setArticles(articlesResult.items);

      const playersResult = await pb.collection('players').getList(1, 1, { $autoCancel: false });
      const allArticlesResult = await pb.collection('articles').getList(1, 1, { $autoCancel: false });
      const pendingArticlesResult = await pb.collection('articles').getList(1, 1, {
        filter: "status='pending'",
        $autoCancel: false
      });

      setStats({
        totalPlayers: playersResult.totalItems,
        totalArticles: allArticlesResult.totalItems,
        pendingArticles: pendingArticlesResult.totalItems
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(t('common.error'));
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchDashboardData();
    }
  }, [currentUser]);

  const handleEditClick = (article) => {
    setEditForm({
      title: article.title || '',
      player_name: article.player_name || '',
      content: article.content || '',
      tags: (article.tags || []).join(', '),
      status: article.status || 'pending'
    });
    setEditingArticle(article);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const tagsArray = editForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const updateData = {
        title: editForm.title,
        player_name: editForm.player_name,
        content: editForm.content,
        tags: tagsArray,
        status: editForm.status
      };

      await pb.collection('articles').update(editingArticle.id, updateData, { $autoCancel: false });

      toast.success(t('common.success'));
      setEditingArticle(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating article:', err);
      toast.error(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingArticle) return;
    setIsProcessing(true);

    try {
      await pb.collection('articles').delete(deletingArticle.id, { $autoCancel: false });
      toast.success(t('common.success'));
      setDeletingArticle(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Error deleting article:', err);
      toast.error(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
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

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('admin.heading')}</h1>
                <p className="text-muted-foreground">{t('admin.desc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('admin.refresh')}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription className="flex items-center justify-between mt-2">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchDashboardData} className="bg-background text-foreground">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('common.retry')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-card border border-border p-1">
              <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="articles">{t('admin.tabs.articles')}</TabsTrigger>
              <TabsTrigger value="settings">{t('admin.tabs.settings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {t('admin.stats.totalPlayers')}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : stats.totalPlayers}</div>
                  </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {t('admin.stats.totalArticles')}
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : stats.totalArticles}</div>
                  </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {t('admin.stats.pendingArticles')}
                    </CardTitle>
                    <Activity className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                      {loading ? <Skeleton className="h-8 w-20" /> : stats.pendingArticles}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {t('admin.quickLinks.players')}
                    </CardTitle>
                    <CardDescription>{t('admin.quickLinks.playersDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => router.push(`/${lang}/${localizedRouteNames['admin/players'][lang]}`)} className="w-full">
                      {t('admin.quickLinks.managePlayers')}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      {t('admin.quickLinks.scraping')}
                    </CardTitle>
                    <CardDescription>{t('admin.quickLinks.scrapingDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" onClick={() => router.push(`/${lang}/${localizedRouteNames['admin/scraping'][lang]}`)} className="w-full">
                      {t('admin.quickLinks.viewScraping')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="articles" className="focus-visible:outline-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
              >
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                  <h2 className="font-semibold text-lg">{t('admin.tabs.articles')}</h2>
                  <Button size="sm" onClick={() => router.push(`/${lang}/${localizedRouteNames['write-article'][lang]}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.createArticle')}
                  </Button>
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>{t('admin.table.title')}</TableHead>
                        <TableHead>{t('admin.table.player')}</TableHead>
                        <TableHead>{t('admin.table.author')}</TableHead>
                        <TableHead>{t('admin.table.date')}</TableHead>
                        <TableHead>{t('admin.table.status')}</TableHead>
                        <TableHead className="text-right">{t('admin.table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Skeleton className="h-9 w-9 rounded-md" />
                                <Skeleton className="h-9 w-9 rounded-md" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : articles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-48 text-center">
                            <Alert className="max-w-md mx-auto border-dashed bg-transparent">
                              <FileText className="h-5 w-5" />
                              <AlertTitle>{t('admin.emptyTitle')}</AlertTitle>
                              <AlertDescription>
                                {t('admin.emptyDesc')}
                              </AlertDescription>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      ) : (
                        articles.map((article) => (
                          <TableRow key={article.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium max-w-[250px] truncate" title={article.title}>
                              {article.title}
                            </TableCell>
                            <TableCell>{article.player_name}</TableCell>
                            <TableCell>
                              {article.expand?.author?.name || article.expand?.author?.email || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(article.created)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(article.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(article)}
                                  title={t('common.edit')}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingArticle(article)}
                                  title={t('common.delete')}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </motion.div>
            </TabsContent>

            <TabsContent value="settings" className="focus-visible:outline-none">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t('admin.tabs.settings')}
                  </CardTitle>
                  <CardDescription>{t('admin.settingsDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label>{t('admin.settings.defaultLanguage')}</Label>
                      <p className="text-sm text-muted-foreground">{t('admin.settings.languageNote')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t('admin.editArticle')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('admin.table.title')}</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player_name">{t('admin.table.player')}</Label>
                <Input
                  id="player_name"
                  value={editForm.player_name}
                  onChange={(e) => setEditForm({...editForm, player_name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">{t('admin.tags')}</Label>
                <Input
                  id="tags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  placeholder="e.g. Grand Slam, ATP, Final"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('admin.table.status')}</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(val) => setEditForm({...editForm, status: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('admin.status.pending')}</SelectItem>
                    <SelectItem value="approved">{t('admin.status.approved')}</SelectItem>
                    <SelectItem value="rejected">{t('admin.status.rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">{t('admin.content')}</Label>
                <Textarea
                  id="content"
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  className="min-h-[200px]"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingArticle(null)}
                disabled={isProcessing}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingArticle} onOpenChange={(open) => !open && setDeletingArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboardClient;
