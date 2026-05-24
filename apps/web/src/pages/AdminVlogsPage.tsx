// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import AdminEditVlogModal from '@/components/AdminEditVlogModal.tsx';
import VlogPreviewModal from '@/components/VlogPreviewModal.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Play, Edit, Trash2, CheckCircle, XCircle, Search, LayoutDashboard, Video, Bug } from 'lucide-react';
import { format } from 'date-fns';

const AdminVlogsPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [vlogs, setVlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fetchError, setFetchError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingVlog, setEditingVlog] = useState(null);
  const [previewVlog, setPreviewVlog] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchVlogs = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      console.log("--- ADMIN VLOGS FETCH DEBUG ---");
      console.log("Current User Role:", currentUser?.role);
      
      const options = {
        sort: '-created',
        $autoCancel: false
      };
      
      if (statusFilter && statusFilter !== 'all') {
        options.filter = `status="${statusFilter}"`;
      }
      
      console.log("Query options being sent to pb.collection('vlogs').getList(1, 100):", options);
      
      const response = await pb.collection('vlogs').getList(1, 100, options);
      
      console.log("Raw response from PocketBase:", response);
      console.log("Items array length:", response.items.length);
      
      if (response.items.length > 0) {
        console.log("First record complete structure:", response.items[0]);
      } else {
        console.log("No records returned.");
      }
      console.log("--- END ADMIN VLOGS FETCH DEBUG ---");
      
      setVlogs(response.items);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('--- ADMIN VLOGS FETCH ERROR ---');
      console.error('Fetch error:', error);
      console.error('Error stack:', error.stack);
      console.error('--- END ADMIN VLOGS FETCH ERROR ---');
      setFetchError(error.message || 'Failed to load vlogs.');
      toast.error('Failed to fetch vlogs. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await pb.collection('vlogs').update(id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Video marked as ${newStatus}`);
      fetchVlogs();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update status');
    }
  };

  const handleBulkAction = async (newStatus) => {
    if (selectedIds.size === 0) return;
    
    const loadingToast = toast.loading(`Updating ${selectedIds.size} videos...`);
    try {
      const promises = Array.from(selectedIds).map(id => 
        pb.collection('vlogs').update(id, { status: newStatus }, { $autoCancel: false })
      );
      await Promise.all(promises);
      toast.success(`Successfully marked ${selectedIds.size} videos as ${newStatus}`, { id: loadingToast });
      fetchVlogs();
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Bulk update failed', { id: loadingToast });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await pb.collection('vlogs').delete(deleteId, { $autoCancel: false });
      toast.success('Video deleted successfully');
      setDeleteId(null);
      fetchVlogs();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete video');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVlogs.length && filteredVlogs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVlogs.map(v => v.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const filteredVlogs = vlogs.filter(v => {
    const searchLower = search.toLowerCase();
    return (
      (v.title || '').toLowerCase().includes(searchLower) || 
      (v.description || '').toLowerCase().includes(searchLower) ||
      (v.uploaderId || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <SEOHelmet title="Admin - Vlogs Management" />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Link to="/en/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" /> Admin
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">Vlogs</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground font-serif">{t('vlogs.admin.title', 'Vlogs Management')}</h1>
              <p className="text-muted-foreground mt-1">{t('vlogs.admin.desc', 'Review, approve, and manage user-submitted videos.')}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDebug(!showDebug)}
                className="text-muted-foreground"
              >
                <Bug className="mr-2 h-4 w-4" /> Debug Info
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('published')}
                disabled={selectedIds.size === 0}
                className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Publish Selected
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('draft')}
                disabled={selectedIds.size === 0}
                className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <XCircle className="mr-2 h-4 w-4" /> Set Draft Selected
              </Button>
            </div>
          </div>

          {showDebug && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6 overflow-x-auto">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Bug className="h-4 w-4" /> Debug Information
              </h3>
              <div className="text-xs font-mono text-muted-foreground space-y-2">
                <p><strong>Total Records Fetched:</strong> {vlogs.length}</p>
                <p><strong>Current Filter:</strong> {statusFilter}</p>
                <p><strong>First Record Data:</strong></p>
                <pre className="bg-background p-2 rounded border border-border">
                  {vlogs.length > 0 ? JSON.stringify(vlogs[0], null, 2) : 'No records available'}
                </pre>
              </div>
            </div>
          )}

          {fetchError && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">Error Loading Collection</p>
              <p className="text-sm">{fetchError}</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-muted/20">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by title, desc, or uploader ID..." 
                  className="pl-9 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft (Pending)</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12 text-center">
                      <Checkbox 
                        checked={selectedIds.size > 0 && selectedIds.size === filteredVlogs.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead className="hidden md:table-cell max-w-[200px]">Description</TableHead>
                    <TableHead className="hidden lg:table-cell">YouTube URL</TableHead>
                    <TableHead>Uploader ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                        <TableCell className="flex items-center gap-3">
                          <Skeleton className="h-12 w-20 rounded" />
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 inline-block" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredVlogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Video className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium text-foreground">No videos to manage</p>
                          <p className="text-sm mt-1 mb-4">Submit your first vlog or adjust your filters to see results.</p>
                          {statusFilter !== 'all' && (
                            <Button variant="outline" onClick={() => setStatusFilter('all')}>
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVlogs.map((vlog) => {
                      const thumb = vlog.thumbnailUrl || 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80';
                      
                      return (
                        <TableRow key={vlog.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={selectedIds.has(vlog.id)}
                              onCheckedChange={() => toggleSelect(vlog.id)}
                              aria-label={`Select ${vlog.title}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div 
                                className="w-20 aspect-video bg-black/10 rounded overflow-hidden shrink-0 relative group cursor-pointer"
                                onClick={() => setPreviewVlog(vlog)}
                              >
                                <img src={thumb} alt={vlog.title || 'Thumbnail'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <Play className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md" />
                              </div>
                              <span className="font-medium text-foreground line-clamp-2" title={vlog.title || 'Untitled'}>
                                {vlog.title || 'Untitled'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px]">
                            <p className="truncate text-sm" title={vlog.description}>{vlog.description || '-'}</p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            <a href={vlog.youtubeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate inline-block max-w-[150px] text-sm">
                              {vlog.youtubeUrl}
                            </a>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap font-mono text-xs">
                            {vlog.uploaderId || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                            {format(new Date(vlog.created || vlog.createdAt || new Date()), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={vlog.status === 'published' ? 'default' : 'secondary'}
                              className="uppercase text-[10px] tracking-wider font-bold"
                            >
                              {vlog.status || 'draft'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              {vlog.status !== 'published' && (
                                <Button size="sm" variant="outline" title="Publish Vlog" className="h-8 text-green-600 border-green-200 bg-green-50/50 hover:bg-green-100" onClick={() => handleStatusChange(vlog.id, 'published')}>
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              {vlog.status !== 'draft' && (
                                <Button size="sm" variant="outline" title="Set to Draft" className="h-8 text-amber-600 border-amber-200 bg-amber-50/50 hover:bg-amber-100" onClick={() => handleStatusChange(vlog.id, 'draft')}>
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingVlog(vlog)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => setDeleteId(vlog.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
        
        <Footer />

        <AdminEditVlogModal 
          vlog={editingVlog} 
          isOpen={!!editingVlog} 
          onClose={() => setEditingVlog(null)} 
          onSuccess={fetchVlogs} 
        />
        
        <VlogPreviewModal
          vlog={previewVlog}
          isOpen={!!previewVlog}
          onClose={() => setPreviewVlog(null)}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the video record from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Video
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default AdminVlogsPage;
