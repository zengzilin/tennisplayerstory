// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { getYouTubeId } from '@/components/VlogCard.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Video, Pencil, Trash2, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

const VlogPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  
  const [vlogs, setVlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    status: 'draft'
  });

  useEffect(() => {
    if (!currentUser) {
      navigate(`/${currentLanguage}/login`);
      return;
    }
    fetchMyVlogs();
  }, [currentUser]);

  const fetchMyVlogs = async () => {
    setLoading(true);
    try {
      // Admin could potentially see all here if we don't scope by uploaderId, but let's scope it.
      const records = await pb.collection('vlogs').getFullList({
        filter: `uploaderId="${currentUser.id}"`,
        sort: '-createdAt',
        $autoCancel: false
      });
      setVlogs(records);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your vlogs");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', youtubeUrl: '', status: 'draft' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!getYouTubeId(formData.youtubeUrl)) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    setSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        uploaderId: currentUser.id,
      };

      if (editingId) {
        await pb.collection('vlogs').update(editingId, dataToSave, { $autoCancel: false });
        toast.success("Vlog updated successfully");
      } else {
        await pb.collection('vlogs').create(dataToSave, { $autoCancel: false });
        toast.success("Vlog uploaded successfully");
      }
      
      resetForm();
      fetchMyVlogs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save vlog");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vlog) => {
    setFormData({
      title: vlog.title,
      description: vlog.description,
      youtubeUrl: vlog.youtubeUrl,
      status: vlog.status
    });
    setEditingId(vlog.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vlog?")) return;
    try {
      await pb.collection('vlogs').delete(id, { $autoCancel: false });
      toast.success("Vlog deleted");
      fetchMyVlogs();
    } catch (err) {
      toast.error("Failed to delete vlog");
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <SEOHelmet title="Manage Vlogs" />
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-4xl mx-auto space-y-10">
            
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Studio Manager</h1>
              <p className="text-muted-foreground">Upload new videos and manage your existing content.</p>
            </div>

            <Card className="shadow-lg border-border">
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  {editingId ? 'Edit Vlog' : 'Upload New Vlog'}
                </CardTitle>
                <CardDescription>Share your tennis journey with the community via YouTube.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube URL <span className="text-destructive">*</span></Label>
                    <Input 
                      id="youtubeUrl" name="youtubeUrl" 
                      value={formData.youtubeUrl} onChange={handleInputChange}
                      placeholder="e.g., https://www.youtube.com/watch?v=..."
                      required
                    />
                    {formData.youtubeUrl && getYouTubeId(formData.youtubeUrl) && (
                      <p className="text-xs text-green-600 font-medium">Valid YouTube link detected</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Video Title <span className="text-destructive">*</span></Label>
                    <Input 
                      id="title" name="title" 
                      value={formData.title} onChange={handleInputChange}
                      placeholder="Catchy title for your vlog"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" name="description" 
                      value={formData.description} onChange={handleInputChange}
                      placeholder="Tell viewers what this video is about..."
                      className="h-32 resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Visibility Status</Label>
                    <div className="flex gap-4">
                      <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors flex-1 ${formData.status === 'published' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted'}`}>
                        <input 
                          type="radio" name="status" value="published" 
                          checked={formData.status === 'published'} 
                          onChange={handleInputChange}
                          className="sr-only" 
                        />
                        <Globe className={`w-4 h-4 ${formData.status === 'published' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm font-medium">Published</p>
                          <p className="text-xs text-muted-foreground">Visible to everyone</p>
                        </div>
                      </label>
                      <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors flex-1 ${formData.status === 'draft' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted'}`}>
                        <input 
                          type="radio" name="status" value="draft" 
                          checked={formData.status === 'draft'} 
                          onChange={handleInputChange}
                          className="sr-only" 
                        />
                        <Lock className={`w-4 h-4 ${formData.status === 'draft' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm font-medium">Draft</p>
                          <p className="text-xs text-muted-foreground">Only visible to you</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    {editingId && (
                      <Button type="button" variant="ghost" onClick={resetForm}>Cancel Edit</Button>
                    )}
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingId ? 'Update Vlog' : 'Upload Vlog'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xl font-bold mb-4">Your Content</h2>
              <div className="admin-table-container">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Video</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                       <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : vlogs.length === 0 ? (
                       <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">You haven't uploaded any vlogs yet.</TableCell></TableRow>
                    ) : (
                      vlogs.map(vlog => (
                        <TableRow key={vlog.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-20 aspect-video bg-muted rounded overflow-hidden flex-shrink-0">
                                <img src={vlog.thumbnailUrl || `https://img.youtube.com/vi/${getYouTubeId(vlog.youtubeUrl)}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="font-medium max-w-[200px] truncate">{vlog.title}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {vlog.status === 'published' 
                              ? <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">Published</Badge>
                              : <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20">Draft</Badge>
                            }
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {vlog.viewCount || 0} views • {vlog.likeCount || 0} likes
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(vlog)} title="Edit">
                              <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
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

          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default VlogPage;