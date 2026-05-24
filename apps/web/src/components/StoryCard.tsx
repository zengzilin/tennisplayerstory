// @ts-nocheck

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import ImageWithAlt from '@/components/ImageWithAlt.tsx';
import { Link } from 'react-router-dom';

const StoryCard = ({ story }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full border-border/50 group">
      <div className="aspect-video overflow-hidden bg-muted">
        <ImageWithAlt
          src={story.image}
          alt={`Thumbnail for tennis article: ${story.title}`}
          title={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">{story.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>{story.readTime} read</span>
            </div>
          </div>
          <h3 className="font-bold text-xl leading-snug text-foreground group-hover:text-primary transition-colors">
            {story.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed line-clamp-3">{story.summary}</p>
        </div>
        <div className="mt-6 pt-4 border-t border-border/50 space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium">{story.author}</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <time dateTime={story.date}>{formatDate(story.date)}</time>
            </div>
          </div>
          <Button variant="outline" className="w-full bg-background" aria-label={`Read more about ${story.title}`}>
            Read more
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryCard;
