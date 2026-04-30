import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, Trash2, Eye, Video, Heart, MessageSquare, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const VlogManagementPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  
  const [vlogs, setVlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, views: 0, likes: 0, comments: 0 });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate(`/${currentLanguage}`);
      return;
    }
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('vlogs').getFullList({
        sort: '-createdAt',
        $autoCancel: false
      });
      setVlogs(records);
      
      const calcStats = records.reduce((acc, curr) => ({
        total: acc.total + 1,
        views: acc.views + (curr.viewCount || 0),
        likes: acc.likes + (curr.likeCount || 0),
        comments: acc.comments + (curr.commentCount || 0)
      }), { total: 0, views: 0, likes: 0, comments: 0 });
      setStats(calcStats);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load vlogs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vlog permanently?")) return;
    try {
      await pb.collection('vlogs').delete(id, { $autoCancel: false });
      toast.success("Vlog deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete vlog");
    }
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <>
      <SEOHelmet pageKey="admin" />
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Vlog Management</h1>
                <p className="text-muted-foreground text-sm">System-wide overview of all video content.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
                  <Video className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.total}</div></CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.views}</div></CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Likes</CardTitle>
                  <Heart className="w-4 h-4 text-rose-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.likes}</div></CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Comments</CardTitle>
                  <MessageSquare className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.comments}</div></CardContent>
              </Card>
            </div>

            <div className="admin-table-container">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Uploader ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 inline-block" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-16 inline-block" /></TableCell>
                      </TableRow>
                    ))
                  ) : vlogs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No vlogs found in the system.</TableCell></TableRow>
                  ) : (
                    vlogs.map(vlog => (
                      <TableRow key={vlog.id}>
                        <TableCell className="font-medium max-w-[250px] truncate">{vlog.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{vlog.uploaderId.substring(0,8)}...</TableCell>
                        <TableCell>
                           {vlog.status === 'published' 
                              ? <Badge className="bg-green-500/10 text-green-600 border-transparent">Published</Badge>
                              : <Badge variant="secondary" className="border-transparent">Draft</Badge>
                            }
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {vlog.viewCount||0}v • {vlog.likeCount||0}l
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/${currentLanguage}/vlog/${vlog.id}`)} title="View Page">
                            <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(vlog.id)} title="Delete">
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default VlogManagementPage;