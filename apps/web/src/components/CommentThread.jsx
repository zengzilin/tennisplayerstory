import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Trash2, Reply } from 'lucide-react';

const CommentItem = ({ comment, allComments, currentUser, onReply, onDelete }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  const replies = allComments.filter(c => c.parentCommentId === comment.id);
  const isOwner = currentUser && currentUser.id === comment.userId;
  const isAdmin = currentUser && currentUser.role === 'admin';

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="group">
      <div className="flex gap-4">
        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {comment.userId ? comment.userId.substring(0, 2).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">User {comment.userId.substring(0, 5)}</span>
              <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
            </div>
            {(isOwner || isAdmin) && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
          
          <div className="flex items-center gap-4 pt-1">
            {currentUser && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsReplying(!isReplying)}
              >
                <Reply className="h-3 w-3 mr-1" /> Reply
              </Button>
            )}
          </div>

          {isReplying && (
            <div className="mt-3 flex gap-3 pr-4">
              <Textarea 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] text-sm resize-none"
              />
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={handleReplySubmit}>Post</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="comment-thread-indent space-y-4">
          {replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              allComments={allComments} 
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentThread = ({ comments, currentUser, onReply, onDelete }) => {
  // Only render top-level comments here
  const topLevelComments = comments.filter(c => !c.parentCommentId);

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {topLevelComments.map(comment => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          allComments={comments} 
          currentUser={currentUser}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CommentThread;