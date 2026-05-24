// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';

const AdminArticlesPage = () => {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [rejectingArticle, setRejectingArticle] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(null);

  const fetchPendingArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await pb.collection('articles').getList(1, 50, {
        filter: "status='pending'",
        expand: 'author',
        sort: '-created',
        $autoCancel: false
      });
      setArticles(result.items);
    } catch (err) {
      console.error('Error fetching pending articles:', err);
      setError(t('adminArticles.loadError'));
      toast.error(t('adminArticles.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingArticles();
  }, []);

  const handleApprove = async (id) => {
    setIsProcessing(id);
    try {
      await pb.collection('articles').update(id, { status: 'approved' }, { $autoCancel: false });
      toast.success(t('adminArticles.approveSuccess'));
      fetchPendingArticles();
    } catch (err) {
      console.error('Error approving article:', err);
      toast.error(t('adminArticles.approveError'));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error(t('adminArticles.reasonReq'));
      return;
    }
    
    setIsProcessing(rejectingArticle.id);
    try {
      await pb.collection('articles').update(rejectingArticle.id, { 
        status: 'rejected',
        rejection_reason: rejectionReason
      }, { $autoCancel: false });
      
      toast.success(t('adminArticles.rejectSuccess'));
      setRejectingArticle(null);
      setRejectionReason('');
      fetchPendingArticles();
    } catch (err) {
      console.error('Error rejecting article:', err);
      toast.error(t('adminArticles.rejectError'));
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('admin.title')} - TennisHub</title>
        <meta name="description" content={t('adminArticles.desc')} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{t('adminArticles.heading')}</h1>
                  <p className="text-muted-foreground">{t('adminArticles.desc')}</p>
                </div>
              </div>
              <Button variant="outline" onClick={fetchPendingArticles} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('adminArticles.refresh')}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={fetchPendingArticles} className="bg-background">
                    {t('common.retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t('adminArticles.table.title')}</TableHead>
                    <TableHead>{t('adminArticles.table.playerName')}</TableHead>
                    <TableHead>{t('adminArticles.table.createdDate')}</TableHead>
                    <TableHead>{t('adminArticles.table.status')}</TableHead>
                    <TableHead className="text-right">{t('adminArticles.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-[250px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-9 w-[80px] rounded-md" />
                            <Skeleton className="h-9 w-[90px] rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-10 w-10 mb-3 opacity-20" />
                          <p className="text-lg font-medium text-foreground">{t('adminArticles.emptyTitle')}</p>
                          <p className="text-sm">{t('adminArticles.emptyDesc')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium max-w-[250px] truncate" title={article.title}>
                          {article.title}
                        </TableCell>
                        <TableCell>{article.player_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(article.created)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">
                            {t('admin.status.pending')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                              onClick={() => setRejectingArticle(article)}
                              disabled={isProcessing === article.id}
                            >
                              <XCircle className="h-4 w-4 mr-1.5" />
                              {t('adminArticles.reject')}
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApprove(article.id)}
                              disabled={isProcessing === article.id}
                            >
                              {isProcessing === article.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                              )}
                              {t('adminArticles.approve')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>

      <Dialog open={!!rejectingArticle} onOpenChange={(open) => !open && setRejectingArticle(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleRejectSubmit}>
            <DialogHeader>
              <DialogTitle>{t('adminArticles.rejectTitle')}</DialogTitle>
              <DialogDescription>
                {t('adminArticles.rejectDesc', { title: rejectingArticle?.title })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">{t('adminArticles.rejectionReason')}</Label>
                <Textarea
                  id="reason"
                  placeholder={t('adminArticles.rejectionPlaceholder')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px] bg-background"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setRejectingArticle(null)} 
                disabled={isProcessing === rejectingArticle?.id}
              >
                {t('adminArticles.cancel')}
              </Button>
              <Button 
                type="submit" 
                variant="destructive" 
                disabled={isProcessing === rejectingArticle?.id}
              >
                {isProcessing === rejectingArticle?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('adminArticles.confirmRejection')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminArticlesPage;