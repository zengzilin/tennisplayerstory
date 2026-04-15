"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
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

interface Article {
  id: string;
  title: string;
  player_name: string;
  created: string;
  status: string;
}

interface AdminArticlesClientProps {
  lang: string;
}

const AdminArticlesClient = ({ lang }: AdminArticlesClientProps) => {
  const t = useTranslations('adminArticles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rejectingArticle, setRejectingArticle] = useState<Article | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchPendingArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch('/api/articles?status=pending&sort=-created');
      setArticles(result.items || []);
    } catch (err) {
      console.error('Error fetching pending articles:', err);
      setError(t('loadError'));
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingArticles();
  }, [t]);

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await apiFetch(`/api/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      toast.success(t('approveSuccess'));
      fetchPendingArticles();
    } catch (err) {
      console.error('Error approving article:', err);
      toast.error(t('approveError'));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error(t('reasonReq'));
      return;
    }

    if (!rejectingArticle) return;

    setIsProcessing(rejectingArticle.id);
    try {
      await apiFetch(`/api/articles/${rejectingArticle.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason,
        }),
      });

      toast.success(t('rejectSuccess'));
      setRejectingArticle(null);
      setRejectionReason('');
      fetchPendingArticles();
    } catch (err) {
      console.error('Error rejecting article:', err);
      toast.error(t('rejectError'));
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('heading')}</h1>
                <p className="text-muted-foreground">{t('desc')}</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchPendingArticles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
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
                  <TableHead>{t('table.title')}</TableHead>
                  <TableHead>{t('table.playerName')}</TableHead>
                  <TableHead>{t('table.createdDate')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
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
                        <p className="text-lg font-medium text-foreground">{t('emptyTitle')}</p>
                        <p className="text-sm">{t('emptyDesc')}</p>
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
                            {t('reject')}
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
                            {t('approve')}
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

      <Dialog open={!!rejectingArticle} onOpenChange={(open) => !open && setRejectingArticle(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleRejectSubmit}>
            <DialogHeader>
              <DialogTitle>{t('rejectTitle')}</DialogTitle>
              <DialogDescription>
                {t('rejectDesc', { title: rejectingArticle?.title || '' })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">{t('rejectionReason')}</Label>
                <Textarea
                  id="reason"
                  placeholder={t('rejectionPlaceholder')}
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
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isProcessing === rejectingArticle?.id}
              >
                {isProcessing === rejectingArticle?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('confirmRejection')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminArticlesClient;