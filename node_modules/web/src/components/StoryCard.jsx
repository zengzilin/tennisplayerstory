
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import ImageWithAlt from '@/components/ImageWithAlt.jsx';

const StoryCard = ({ story }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full">
      <div className="aspect-video overflow-hidden bg-muted">
        <ImageWithAlt
          src={story.image}
          alt={`Cover image for story: ${story.title}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{story.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{story.readTime}</span>
            </div>
          </div>
          <h3 className="font-bold text-xl leading-tight">{story.title}</h3>
          <p className="text-muted-foreground leading-relaxed">{story.summary}</p>
        </div>
        <div className="mt-6 pt-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium">{story.author}</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(story.date)}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full group">
            Read more
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryCard;
