// @ts-nocheck

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getYouTubeId, getYouTubeThumbnail } from '@/utils/youtubeUtils.js';
import ImageWithAlt from './ImageWithAlt.tsx';

const VlogCard = ({ vlog, onClick }) => {
  const title = vlog.title || "Untitled Video";
  const channelName = vlog.channel_name || vlog.uploaderId || "Unknown";
  const views = vlog.views || vlog.viewCount || 0;
  const date = vlog.published_date || vlog.createdAt || new Date().toISOString();
  
  const ytId = getYouTubeId(vlog.youtubeUrl);
  const thumbnailUrl = vlog.thumbnail_url || vlog.thumbnailUrl || getYouTubeThumbnail(ytId, 'mqdefault') || 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80';

  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });

  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-border/50 bg-card cursor-pointer flex flex-col h-full"
      onClick={() => onClick?.(vlog)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(vlog)}
      aria-label={`Play vlog: ${title}`}
    >
      <div className="relative aspect-video bg-muted shrink-0 overflow-hidden">
        <ImageWithAlt
          src={thumbnailUrl} 
          alt={`Video thumbnail for ${title}`}
          title={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity duration-300 backdrop-blur-[1px] group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
            <Play className="w-6 h-6 ml-1" aria-hidden="true" />
          </div>
        </div>
        {vlog.status && vlog.status !== 'approved' && vlog.status !== 'published' && (
          <div className="absolute top-2 right-2 z-10">
             <Badge variant={vlog.status === 'pending' || vlog.status === 'draft' ? 'secondary' : 'destructive'} className="uppercase text-[10px] font-bold tracking-wider">
               {vlog.status}
             </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>
        
        <div className="mt-auto space-y-2 pt-3 border-t border-border/40">
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <User className="w-4 h-4 shrink-0 text-secondary" aria-hidden="true" />
            <span className="truncate font-medium">{channelName}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              {views.toLocaleString()} views
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              <time dateTime={date}>{formattedDate}</time>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VlogCard;
