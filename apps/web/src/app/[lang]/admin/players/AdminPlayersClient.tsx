// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Users, Loader2, AlertCircle, RefreshCw, Plus, Pencil, Trash2, Upload, Search, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const localizedRouteNames = {
  login: { en: 'login', zh: '登录', ja: 'ログイン', es: 'iniciar-sesion', fr: 'connexion' },
};

const AdminPlayersClient = ({ lang }: { lang: LangCode }) => {
  const { currentUser } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingPlayer, setDeletingPlayer] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    country: '',
    source: 'atp',
    ranking: '',
    age: '',
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    country: '',
    source: 'atp',
    ranking: '',
    age: '',
  });

  useEffect(() => {
    if (!currentUser) {
      router.push(`/${lang}/${localizedRouteNames.login[lang]}`);
    } else if (currentUser.role !== 'admin') {
      router.push(`/${lang}`);
      toast.error(t('common.unauthorized'));
    }
  }, [currentUser, lang, router, t]);

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/players?pageSize=500&sort=ranking');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setPlayers(json.items || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(t('common.error'));
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchPlayers();
    }
  }, [currentUser]);

  const handleAddClick = () => {
    setAddForm({ name: '', country: '', source: 'atp', ranking: '', age: '' });
    setShowAddDialog(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const data = {
        name: addForm.name,
        country: addForm.country || '',
        source: addForm.source,
        ranking: addForm.ranking ? parseInt(addForm.ranking, 10) : null,
        age: addForm.age ? parseInt(addForm.age, 10) : null,
      };
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create player');
      toast.success(t('common.success'));
      setShowAddDialog(false);
      fetchPlayers();
    } catch (err) {
      console.error('Error adding player:', err);
      toast.error(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClick = (player) => {
    setEditForm({
      name: player.name || '',
      country: player.country || '',
      source: player.source || 'atp',
      ranking: player.ranking?.toString() || '',
      age: player.age?.toString() || '',
    });
    setEditingPlayer(player);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const data = {
        name: editForm.name,
        country: editForm.country,
        source: editForm.source,
        ranking: editForm.ranking ? parseInt(editForm.ranking, 10) : null,
        age: editForm.age ? parseInt(editForm.age, 10) : null,
      };
      const res = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update player');
      toast.success(t('common.success'));
      setEditingPlayer(null);
      fetchPlayers();
    } catch (err) {
      console.error('Error updating player:', err);
      toast.error(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlayer) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/players/${deletingPlayer.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete player');
      toast.success(t('common.success'));
      setDeletingPlayer(null);
      fetchPlayers();
    } catch (err) {
      console.error('Error deleting player:', err);
      toast.error(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPlayers = searchQuery
    ? players.filter(p =>
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.country || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.source || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : players;

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
                <h1 className="text-3xl font-bold">{t('admin.players.players', { default: 'Player Management' })}</h1>
                <p className="text-muted-foreground">{t('admin.quickLinks.playersDesc', { default: 'Manage tennis players in the database.' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={fetchPlayers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('admin.refresh', { default: 'Refresh' })}
              </Button>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                {t('common.add', { default: 'Add Player' })}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription className="flex items-center justify-between mt-2">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchPlayers} className="bg-background text-foreground">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('common.retry', { default: 'Retry' })}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search', { default: 'Search players...' })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
          >
            <ScrollArea className="w-full whitespace-nowrap">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t('admin.table.player', { default: 'Player' })}</TableHead>
                    <TableHead>{t('playerCard.country', { default: 'Country' })}</TableHead>
                    <TableHead>{t('playerCard.tour', { default: 'Tour' })}</TableHead>
                    <TableHead>{t('playerDetail.ranking', { default: 'Ranking' })}</TableHead>
                    <TableHead>{t('playerCard.age', { default: 'Age' })}</TableHead>
                    <TableHead className="text-right">{t('admin.table.actions', { default: 'Actions' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[50px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[40px]" /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-9 w-9 rounded-md" />
                            <Skeleton className="h-9 w-9 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="h-10 w-10 mb-3 opacity-20" />
                          <p className="text-lg font-medium text-foreground">
                            {searchQuery ? t('common.noResults', { default: 'No players found' }) : t('admin.emptyTitle', { default: 'No Players' })}
                          </p>
                          <p className="text-sm">
                            {searchQuery ? t('common.noResultsDesc', { default: 'Try a different search term.' }) : t('admin.emptyDesc', { default: 'No players in the database yet.' })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => (
                      <TableRow key={player.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>{player.country || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-xs">
                            {player.source || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{player.ranking || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{player.age || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(player)}
                              title={t('common.edit', { default: 'Edit' })}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingPlayer(player)}
                              title={t('common.delete', { default: 'Delete' })}
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
        </div>
      </main>

      {/* Add Player Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && setShowAddDialog(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>{t('common.add', { default: 'Add Player' })}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">{t('admin.table.player', { default: 'Player Name' })}</Label>
                <Input
                  id="add-name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-country">{t('playerCard.country', { default: 'Country' })}</Label>
                <Input
                  id="add-country"
                  value={addForm.country}
                  onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-source">{t('playerCard.tour', { default: 'Tour' })}</Label>
                <Select
                  value={addForm.source}
                  onValueChange={(val) => setAddForm({ ...addForm, source: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atp">ATP</SelectItem>
                    <SelectItem value="wta">WTA</SelectItem>
                    <SelectItem value="itf">ITF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-ranking">{t('playerDetail.ranking', { default: 'Ranking' })}</Label>
                  <Input
                    id="add-ranking"
                    type="number"
                    value={addForm.ranking}
                    onChange={(e) => setAddForm({ ...addForm, ranking: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-age">{t('playerCard.age', { default: 'Age' })}</Label>
                  <Input
                    id="add-age"
                    type="number"
                    value={addForm.age}
                    onChange={(e) => setAddForm({ ...addForm, age: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={isProcessing}>
                {t('common.cancel', { default: 'Cancel' })}
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save', { default: 'Save' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && setEditingPlayer(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t('common.edit', { default: 'Edit Player' })}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('admin.table.player', { default: 'Player Name' })}</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">{t('playerCard.country', { default: 'Country' })}</Label>
                <Input
                  id="edit-country"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-source">{t('playerCard.tour', { default: 'Tour' })}</Label>
                <Select
                  value={editForm.source}
                  onValueChange={(val) => setEditForm({ ...editForm, source: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atp">ATP</SelectItem>
                    <SelectItem value="wta">WTA</SelectItem>
                    <SelectItem value="itf">ITF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ranking">{t('playerDetail.ranking', { default: 'Ranking' })}</Label>
                  <Input
                    id="edit-ranking"
                    type="number"
                    value={editForm.ranking}
                    onChange={(e) => setEditForm({ ...editForm, ranking: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-age">{t('playerCard.age', { default: 'Age' })}</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingPlayer(null)} disabled={isProcessing}>
                {t('common.cancel', { default: 'Cancel' })}
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save', { default: 'Save' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPlayer} onOpenChange={(open) => !open && setDeletingPlayer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteConfirmTitle', { default: 'Are you absolutely sure?' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteConfirmDesc', { default: 'This action cannot be undone. This will permanently delete the player.' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('common.cancel', { default: 'Cancel' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete', { default: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPlayersClient;
