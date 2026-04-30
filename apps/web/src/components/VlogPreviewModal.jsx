import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getYouTubeId } from '@/utils/youtubeUtils.js';

const VlogPreviewModal = ({ vlog, isOpen, onClose }) => {
  if (!vlog) return null;

  // Fallback to older DB fields if needed, based on migration status
  const youtubeId = getYouTubeId(vlog.youtubeUrl);
  const title = vlog.title || "Untitled Video";
  const description = vlog.description || "";
  const channelName = vlog.channel_name || vlog.uploaderId || "Unknown Channel";
  const views = vlog.views || vlog.viewCount || 0;
  const status = vlog.status || "pending";
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-full p-0 overflow-hidden bg-card border-border">
        <div className="w-full bg-black aspect-video relative">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Invalid Video ID
            </div>
          )}
        </div>
        
        <div className="p-6 space-y-4">
          <DialogHeader>
            <div className="flex justify-between items-start gap-4">
              <DialogTitle className="text-2xl font-bold text-foreground font-serif">
                {title}
              </DialogTitle>
              <Badge variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                {status}
              </Badge>
            </div>
            <DialogDescription className="text-muted-foreground flex items-center gap-3">
              <span className="font-medium text-foreground">{channelName}</span>
              <span>•</span>
              <span>{views.toLocaleString()} views</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-sm text-foreground/90 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {description}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VlogPreviewModal;