import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import CommentThread from '@/components/CommentThread.jsx';
import { getYouTubeId } from '@/utils/youtubeUtils.js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Bookmark, Share2, Eye, Calendar, User, MessageSquare, Video } from 'lucide-react';
import { toast } from 'sonner';

const VlogDetailPage = () => {
  const { id } = useParams();
  const { currentLanguage } = useLanguage();
  const { currentUser } = useAuth();
  
  const [vlog, setVlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [likeRecordId, setLikeRecordId] = useState(null);
  const [saveRecordId, setSaveRecordId] = useState(null);

  useEffect(() => {
    const fetchVlogData = async () => {
      try {
        setLoading(true);
        // Fetch vlog
        const vlogData = await pb.collection('vlogs').getOne(id, { $autoCancel: false });
        setVlog(vlogData);

        // Increment view count (simple approach, might double count in strict mode but acceptable for now)
        pb.collection('vlogs').update(id, { viewCount: (vlogData.viewCount || 0) + 1 }, { $autoCancel: false }).catch(console.error);

        // Fetch comments
        fetchComments();

        // Check if current user liked/saved
        if (currentUser) {
          const likes = await pb.collection('vlogLikes').getList(1, 1, {
            filter: `vlogId="${id}" && userId="${currentUser.id}"`,
            $autoCancel: false
          });
          if (likes.items.length > 0) {
            setHasLiked(true);
            setLikeRecordId(likes.items[0].id);
          }

          const saves = await pb.collection('vlogSaves').getList(1, 1, {
            filter: `vlogId="${id}" && userId="${currentUser.id}"`,
            $autoCancel: false
          });
          if (saves.items.length > 0) {
            setHasSaved(true);
            setSaveRecordId(saves.items[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching vlog:", err);
        toast.error("Failed to load vlog.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVlogData();
  }, [id, currentUser]);

  const fetchComments = async () => {
    try {
      const records = await pb.collection('vlogComments').getList(1, 100, {
        filter: `vlogId="${id}"`,
        sort: 'createdAt',
        $autoCancel: false
      });
      setComments(records.items);
    } catch (err) {
      console.error("Error fetching comments", err);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      toast.error("Please login to like this vlog");
      return;
    }
    
    try {
      if (hasLiked && likeRecordId) {
        await pb.collection('vlogLikes').delete(likeRecordId, { $autoCancel: false });
        setHasLiked(false);
        setLikeRecordId(null);
        setVlog(prev => ({ ...prev, likeCount: Math.max(0, (prev.likeCount || 1) - 1) }));
        // Optimistically update main record
        pb.collection('vlogs').update(id, { likeCount: Math.max(0, (vlog.likeCount || 1) - 1) }, { $autoCancel: false });
      } else {
        const record = await pb.collection('vlogLikes').create({ vlogId: id, userId: currentUser.id }, { $autoCancel: false });
        setHasLiked(true);
        setLikeRecordId(record.id);
        setVlog(prev => ({ ...prev, likeCount: (prev.likeCount || 0) + 1 }));
        pb.collection('vlogs').update(id, { likeCount: (vlog.likeCount || 0) + 1 }, { $autoCancel: false });
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleToggleSave = async () => {
    if (!currentUser) {
      toast.error("Please login to save this vlog");
      return;
    }
    
    try {
      if (hasSaved && saveRecordId) {
        await pb.collection('vlogSaves').delete(saveRecordId, { $autoCancel: false });
        setHasSaved(false);
        setSaveRecordId(null);
        toast.success("Removed from saves");
      } else {
        const record = await pb.collection('vlogSaves').create({ vlogId: id, userId: currentUser.id }, { $autoCancel: false });
        setHasSaved(true);
        setSaveRecordId(record.id);
        toast.success("Vlog saved");
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleAddComment = async (content, parentId = '') => {
    if (!currentUser) {
      toast.error("Please login to comment");
      return;
    }
    if (!content.trim()) return;

    try {
      await pb.collection('vlogComments').create({
        vlogId: id,
        userId: currentUser.id,
        content: content,
        parentCommentId: parentId
      }, { $autoCancel: false });
      
      setNewComment('');
      fetchComments();
      toast.success("Comment posted");
      
      // Update comment count
      const newCount = (vlog.commentCount || 0) + 1;
      setVlog(prev => ({ ...prev, commentCount: newCount }));
      pb.collection('vlogs').update(id, { commentCount: newCount }, { $autoCancel: false });
    } catch (err) {
      toast.error("Failed to post comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await pb.collection('vlogComments').delete(commentId, { $autoCancel: false });
      fetchComments();
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="w-full aspect-video rounded-xl mb-8" />
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <div className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!vlog) return null;

  const ytId = getYouTubeId(vlog.youtubeUrl);
  const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <SEOHelmet title={`${vlog.title} - Tennis Vlogs`} description={vlog.description} />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Video Player */}
              <div className="video-container shadow-xl">
                {ytId ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`} 
                    title={vlog.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="rounded-xl border-none w-full aspect-video"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                    Invalid Video URL
                  </div>
                )}
              </div>

              {/* Title & Actions */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 text-balance leading-snug">
                  {vlog.title}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {vlog.viewCount || 0} views</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(vlog.createdAt || vlog.created)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={hasLiked ? "secondary" : "outline"} 
                      size="sm" 
                      onClick={handleToggleLike}
                      className={`rounded-full px-4 ${hasLiked ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20' : ''}`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${hasLiked ? 'fill-current' : ''}`} /> 
                      {vlog.likeCount || 0}
                    </Button>
                    <Button 
                      variant={hasSaved ? "secondary" : "outline"} 
                      size="sm"
                      onClick={handleToggleSave}
                      className="rounded-full px-4"
                    >
                      <Bookmark className={`w-4 h-4 mr-2 ${hasSaved ? 'fill-current text-primary' : ''}`} />
                      {hasSaved ? 'Saved' : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full px-4">
                      <Share2 className="w-4 h-4 mr-2" /> Share
                    </Button>
                  </div>
                </div>
              </div>

              {/* Description & Uploader */}
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">User {vlog.uploaderId?.substring(0, 5) || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">Uploader</p>
                  </div>
                </div>
                <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {vlog.description || "No description."}
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {comments.length} Comments
                </h3>
                
                {currentUser ? (
                  <div className="flex gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center border border-border text-xs font-bold text-muted-foreground">
                      You
                    </div>
                    <div className="flex-1 space-y-3">
                      <Textarea 
                        placeholder="Add a public comment..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="resize-none bg-background focus-visible:ring-primary"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleAddComment(newComment)}
                          disabled={!newComment.trim()}
                        >
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 mb-8 text-center border border-border">
                    <p className="text-muted-foreground mb-3">Sign in to join the conversation.</p>
                    <Button asChild variant="outline">
                      <Link to={`/${currentLanguage}/login`}>Log In</Link>
                    </Button>
                  </div>
                )}

                <CommentThread 
                  comments={comments} 
                  currentUser={currentUser} 
                  onReply={(parentId, content) => handleAddComment(content, parentId)}
                  onDelete={handleDeleteComment}
                />
              </div>
            </div>

            {/* Sidebar - Related Vlogs Placeholder */}
            <div className="lg:col-span-1 space-y-6">
              <h3 className="font-bold text-lg border-b border-border pb-2">Up Next</h3>
              <div className="space-y-4">
                 {/* Empty state for related vlogs to keep UI realistic without complex queries */}
                 <div className="bg-muted/30 rounded-xl p-8 text-center border border-border border-dashed">
                    <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">More related videos will appear here soon.</p>
                 </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default VlogDetailPage;