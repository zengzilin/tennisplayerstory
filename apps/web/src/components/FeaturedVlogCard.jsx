
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Eye, Calendar, ArrowRight } from 'lucide-react';
import ImageWithAlt from '@/components/ImageWithAlt.jsx';
import { getYouTubeId, getYouTubeThumbnail } from '@/utils/youtubeUtils.js';

const FeaturedVlogCard = ({ vlog }) => {
  const title = vlog.title || "Untitled Video";
  const views = vlog.viewCount || vlog.views || 0;
  const date = vlog.published_date || vlog.createdAt || new Date().toISOString();
  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });
  
  const ytId = getYouTubeId(vlog.youtubeUrl);
  const thumbnailUrl = vlog.thumbnailUrl || vlog.thumbnail_url || getYouTubeThumbnail(ytId, 'maxresdefault') || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80';

  return (
    <motion.div 
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card className="group overflow-hidden flex flex-col h-full bg-card dark:bg-slate-800 border-border dark:border-slate-700 shadow-sm vlog-card-hover">
        <div className="relative aspect-video bg-muted dark:bg-slate-900 shrink-0 overflow-hidden">
          <ImageWithAlt
            src={thumbnailUrl} 
            alt={`Featured vlog thumbnail: ${title}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="vlog-play-overlay">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-400">
              <Play className="w-7 h-7 ml-1" aria-hidden="true" />
            </div>
          </div>
          
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <Badge variant="secondary" className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-md text-foreground dark:text-slate-50 border-none font-semibold shadow-sm">
              Analysis
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-6 flex flex-col flex-1 relative">
          <h3 className="font-bold text-xl text-foreground dark:text-slate-50 group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-3">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2 mb-6 flex-1">
            {vlog.description || "Join the discussion and watch this detailed breakdown from the professional tennis tour."}
          </p>
          
          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-secondary" aria-hidden="true" />
                {views.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary/70" aria-hidden="true" />
                <time dateTime={date}>{formattedDate}</time>
              </span>
            </div>
            
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300">
              <Link to={`/vlog/${vlog.id}`}>
                Watch Now
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeaturedVlogCard;
