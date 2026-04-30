
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage, availableLanguages } from '@/contexts/LanguageContext.jsx';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
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
import { ShieldAlert, Loader2, AlertCircle, RefreshCw, FileText, Pencil, Trash2, Plus, Users, Database, Settings, Activity, Video, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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

  const langPrefix = `/${currentLanguage}`;

  useEffect(() => {
    if (!currentUser) {
      navigate(`${langPrefix}/login`, { replace: true });
    } else if (currentUser.role !== 'admin') {
      navigate(langPrefix, { replace: true });
      toast.error(t('common.unauthorized', 'Unauthorized access'));
    }
  }, [currentUser, navigate, t, langPrefix]);

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
      setError(t('common.error', 'An error occurred while fetching data'));
      toast.error(t('common.error', 'An error occurred'));
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
      
      toast.success(t('common.success', 'Success'));
      setEditingArticle(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating article:', err);
      toast.error(t('common.error', 'An error occurred'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingArticle) return;
    setIsProcessing(true);
    
    try {
      await pb.collection('articles').delete(deletingArticle.id, { $autoCancel: false });
      toast.success(t('common.success', 'Success'));
      setDeletingArticle(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Error deleting article:', err);
      toast.error(t('common.error', 'An error occurred'));
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
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">{t('admin.status.approved', 'Approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">{t('admin.status.rejected', 'Rejected')}</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">{t('admin.status.pending', 'Pending')}</Badge>;
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <>
      <SEOHelmet pageKey="admin" />

      <div className="min-h-screen flex flex-col bg-muted/30 dark:bg-slate-950 transition-colors duration-300">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold dark:text-slate-50">{t('admin.heading', 'Admin Dashboard')}</h1>
                  <p className="text-muted-foreground dark:text-slate-400">{t('admin.desc', 'Manage platform content and data')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={fetchDashboardData} disabled={loading} className="dark:border-slate-700 dark:text-slate-50">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t('admin.refresh', 'Refresh')}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
                <AlertDescription className="flex items-center justify-between mt-2">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={fetchDashboardData} className="bg-background text-foreground">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('common.retry', 'Retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="bg-card border border-border p-1 dark:bg-slate-800 dark:border-slate-700">
                <TabsTrigger value="overview" className="dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50">{t('admin.tabs.overview', 'Overview')}</TabsTrigger>
                <TabsTrigger value="articles" className="dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50">{t('admin.tabs.articles', 'Articles')}</TabsTrigger>
                <TabsTrigger value="settings" className="dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50">{t('admin.tabs.settings', 'Settings')}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-border shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
                        {t('admin.stats.totalPlayers', 'Total Players')}
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold dark:text-slate-50">{loading ? <Skeleton className="h-8 w-20" /> : stats.totalPlayers}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-border shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
                        {t('admin.stats.totalArticles', 'Total Articles')}
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold dark:text-slate-50">{loading ? <Skeleton className="h-8 w-20" /> : stats.totalArticles}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-border shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
                        {t('admin.stats.pendingArticles', 'Pending Articles')}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-border shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-slate-50">
                        <Users className="h-5 w-5 text-primary" />
                        {t('admin.quickLinks.players', 'Player Management')}
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">{t('admin.quickLinks.playersDesc', 'Add, edit, or remove tennis players from the database.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full dark:bg-primary dark:text-primary-foreground">
                        <Link to={`${langPrefix}/admin/players`}>{t('admin.quickLinks.managePlayers', 'Manage Players')}</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-slate-50">
                        <Database className="h-5 w-5 text-primary" />
                        {t('admin.quickLinks.scraping', 'Data Scraping')}
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">{t('admin.quickLinks.scrapingDesc', 'Monitor and trigger automated data extraction from ATP/WTA/ITF.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="secondary" className="w-full">
                        <Link to={`${langPrefix}/admin/scraping`}>{t('admin.quickLinks.viewScraping', 'Scraping Dashboard')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-border shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-slate-50">
                        <Video className="h-5 w-5 text-primary" />
                        Vlog Management
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">Manage user-submitted vlogs, edit statuses, and review video content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="w-full border-primary/20 hover:bg-primary/5 dark:border-slate-700 dark:text-slate-50">
                        <Link to={`${langPrefix}/admin/vlogs`}>Manage Vlogs</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-slate-50">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Content Manager
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">Generate and manage tennis articles using AI. Search topics and create SEO-optimized content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => navigate(`${langPrefix}/admin/content-manager`)} className="w-full dark:bg-primary dark:text-primary-foreground">
                        Generate Articles
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
                  className="bg-card rounded-xl border border-border shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700"
                >
                  <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20 dark:bg-slate-900/50 dark:border-slate-700">
                    <h2 className="font-semibold text-lg dark:text-slate-50">{t('admin.tabs.articles', 'Articles')}</h2>
                    <Button size="sm" onClick={() => navigate(`${langPrefix}/write-article`)} className="dark:bg-primary dark:text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('admin.createArticle', 'Create Article')}
                    </Button>
                  </div>
                  <ScrollArea className="w-full whitespace-nowrap">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 dark:bg-slate-900/50 dark:border-slate-700">
                          <TableHead className="dark:text-slate-400">{t('admin.table.title', 'Title')}</TableHead>
                          <TableHead className="dark:text-slate-400">{t('admin.table.player', 'Player')}</TableHead>
                          <TableHead className="dark:text-slate-400">{t('admin.table.author', 'Author')}</TableHead>
                          <TableHead className="dark:text-slate-400">{t('admin.table.date', 'Date')}</TableHead>
                          <TableHead className="dark:text-slate-400">{t('admin.table.status', 'Status')}</TableHead>
                          <TableHead className="text-right dark:text-slate-400">{t('admin.table.actions', 'Actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i} className="dark:border-slate-700">
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
                          <TableRow className="dark:border-slate-700">
                            <TableCell colSpan={6} className="h-48 text-center">
                              <Alert className="max-w-md mx-auto border-dashed bg-transparent dark:border-slate-700">
                                <FileText className="h-5 w-5 dark:text-slate-400" />
                                <AlertTitle className="dark:text-slate-50">{t('admin.emptyTitle', 'No Articles')}</AlertTitle>
                                <AlertDescription className="dark:text-slate-400">
                                  {t('admin.emptyDesc', 'No articles to process')}
                                </AlertDescription>
                              </Alert>
                            </TableCell>
                          </TableRow>
                        ) : (
                          articles.map((article) => (
                            <TableRow key={article.id} className="hover:bg-muted/50 transition-colors dark:border-slate-700 dark:hover:bg-slate-700/50">
                              <TableCell className="font-medium max-w-[250px] truncate dark:text-slate-50" title={article.title}>
                                {article.title}
                              </TableCell>
                              <TableCell className="dark:text-slate-300">{article.player_name}</TableCell>
                              <TableCell className="dark:text-slate-300">
                                {article.expand?.author?.name || article.expand?.author?.email || 'Unknown'}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm dark:text-slate-400">
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
                                    title={t('common.edit', 'Edit')}
                                    className="dark:hover:bg-slate-700"
                                  >
                                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary dark:text-slate-400" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setDeletingArticle(article)}
                                    title={t('common.delete', 'Delete')}
                                    className="dark:hover:bg-slate-700"
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive dark:text-slate-400" />
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
                <Card className="border-border shadow-sm dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-slate-50">
                      <Settings className="h-5 w-5" />
                      {t('admin.tabs.settings', 'Settings')}
                    </CardTitle>
                    <CardDescription className="dark:text-slate-400">{t('admin.settingsDesc', 'Manage platform preferences')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label className="dark:text-slate-50">{t('admin.settings.defaultLanguage', 'Default Language')}</Label>
                        <Select value={currentLanguage} onValueChange={(val) => changeLanguage(val, true)}>
                          <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                            {availableLanguages.map(lang => (
                              <SelectItem key={lang.code} value={lang.code} className="dark:text-slate-50 dark:focus:bg-slate-700">{lang.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button disabled className="dark:bg-slate-700 dark:text-slate-400">{t('common.save', 'Save Changes')}</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>

      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="dark:text-slate-50">{t('admin.editArticle', 'Edit Article')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="dark:text-slate-50">{t('admin.table.title', 'Title')}</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  required
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player_name" className="dark:text-slate-50">{t('admin.table.player', 'Player')}</Label>
                <Input
                  id="player_name"
                  value={editForm.player_name}
                  onChange={(e) => setEditForm({...editForm, player_name: e.target.value})}
                  required
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags" className="dark:text-slate-50">{t('admin.tags', 'Tags (comma-separated)')}</Label>
                <Input
                  id="tags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  placeholder="e.g. Grand Slam, ATP, Final"
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="dark:text-slate-50">{t('admin.table.status', 'Status')}</Label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(val) => setEditForm({...editForm, status: val})}
                >
                  <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50">
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                    <SelectItem value="pending" className="dark:text-slate-50 dark:focus:bg-slate-700">{t('admin.status.pending', 'Pending')}</SelectItem>
                    <SelectItem value="approved" className="dark:text-slate-50 dark:focus:bg-slate-700">{t('admin.status.approved', 'Approved')}</SelectItem>
                    <SelectItem value="rejected" className="dark:text-slate-50 dark:focus:bg-slate-700">{t('admin.status.rejected', 'Rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content" className="dark:text-slate-50">{t('admin.content', 'Content')}</Label>
                <Textarea
                  id="content"
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  className="min-h-[200px] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
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
                className="dark:border-slate-700 dark:text-slate-50 dark:hover:bg-slate-700"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isProcessing}
                className="dark:bg-primary dark:text-primary-foreground"
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingArticle} onOpenChange={(open) => !open && setDeletingArticle(null)}>
        <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-50">{t('admin.deleteConfirmTitle', 'Are you absolutely sure?')}</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              {t('admin.deleteConfirmDesc', 'This action cannot be undone. This will permanently delete the article.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} className="dark:border-slate-700 dark:text-slate-50 dark:hover:bg-slate-700">{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminDashboard;
