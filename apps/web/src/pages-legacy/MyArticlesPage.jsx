export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Edit, Trash2, Eye, Loader2, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const MyArticlesPage = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingArticle, setEditingArticle] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', player_name: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [viewingArticle, setViewingArticle] = useState(null);

  const fetchArticles = async () => {
    try {
      const records = await pb.collection('articles').getFullList({
        filter: `author = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setArticles(records);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [currentUser.id]);

  const handleEditClick = (article) => {
    setEditingArticle(article);
    setEditFormData({
      title: article.title,
      player_name: article.player_name,
      content: article.content
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await pb.collection('articles').update(editingArticle.id, editFormData, { $autoCancel: false });
      toast.success(t('common.success'));
      setEditingArticle(null);
      fetchArticles();
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await pb.collection('articles').delete(deletingArticle.id, { $autoCancel: false });
      toast.success(t('common.success'));
      setDeletingArticle(null);
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">{t('admin.status.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('admin.status.rejected')}</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30">{t('admin.status.pending')}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('articles.myArticles')} - TennisHub</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{t('articles.myArticles')}</h1>
                  <p className="text-muted-foreground">{t('articles.manageStories')}</p>
                </div>
              </div>
              <Button asChild>
                <Link to="../write-article">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('articles.writeNew')}
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border shadow-sm">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">{t('articles.noArticles')}</h3>
                <p className="text-muted-foreground mb-6">{t('articles.noArticlesDesc')}</p>
                <Button asChild variant="outline">
                  <Link to="../write-article">{t('articles.startWriting')}</Link>
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="admin-table-container"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>{t('articles.title')}</TableHead>
                      <TableHead>{t('articles.player')}</TableHead>
                      <TableHead>{t('articles.date')}</TableHead>
                      <TableHead>{t('articles.status')}</TableHead>
                      <TableHead className="text-right">{t('articles.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium max-w-[250px] truncate">
                          {article.title}
                          {article.status === 'rejected' && article.rejection_reason && (
                            <div className="flex items-center text-xs text-destructive mt-1">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              <span className="truncate">{article.rejection_reason}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{article.player_name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(article.created)}</TableCell>
                        <TableCell>{getStatusBadge(article.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setViewingArticle(article)} title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {article.status === 'pending' && (
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(article)} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeletingArticle(article)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t('articles.editArticle')}</DialogTitle>
              <DialogDescription>
                {t('articles.editDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">{t('articles.title')}</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-player">{t('articles.featuredPlayer')}</Label>
                <Input
                  id="edit-player"
                  value={editFormData.player_name}
                  onChange={(e) => setEditFormData({...editFormData, player_name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">{t('articles.content')}</Label>
                <Textarea
                  id="edit-content"
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
                  className="min-h-[200px]"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingArticle(null)} disabled={isSaving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('articles.saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingArticle} onOpenChange={(open) => !open && setViewingArticle(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {viewingArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(viewingArticle.status)}
                  <span className="text-sm text-muted-foreground">{formatDate(viewingArticle.created)}</span>
                </div>
                <DialogTitle className="text-2xl">{viewingArticle.title}</DialogTitle>
                <DialogDescription>
                  {t('articles.featuredPlayer')}: <span className="font-medium text-foreground">{viewingArticle.player_name}</span>
                </DialogDescription>
              </DialogHeader>
              
              {viewingArticle.status === 'rejected' && viewingArticle.rejection_reason && (
                <Alert variant="destructive" className="my-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{t('articles.rejectionReason')}</strong> {viewingArticle.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-6 whitespace-pre-wrap text-foreground leading-relaxed">
                {viewingArticle.content}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingArticle} onOpenChange={(open) => !open && setDeletingArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('articles.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('articles.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyArticlesPage;
