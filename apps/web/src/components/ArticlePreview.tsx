// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ArticlePreview = ({ article, onTagClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const content = article.content || '';
  const isLong = content.length > 50;
  const displayContent = isExpanded || !isLong ? content : content.substring(0, 50) + '...';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-all duration-300 border-border/50 h-full">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <Badge
            variant="outline"
            className="bg-muted/50 text-muted-foreground border-border cursor-pointer hover:bg-muted transition-colors"
            onClick={() => article.player_name && onTagClick?.(article.player_name)}
          >
            <Trophy className="h-3 w-3 mr-1" />
            {article.player_name}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(article.created)}</span>
          </div>
        </div>

        <h3 className="font-bold text-2xl leading-tight mb-4 text-foreground">
          {article.title}
        </h3>

        <div className="text-muted-foreground leading-relaxed mb-2 whitespace-pre-wrap">
          {displayContent}
        </div>

        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary text-sm font-medium hover:underline mb-6 text-left w-fit"
          >
            {isExpanded ? t('stories.hide', 'Hide') : t('stories.expand', 'Read more')}
          </button>
        )}

        <div className="flex flex-wrap gap-2 mb-6 mt-auto pt-4">
          {(article.tags || []).map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => onTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="pt-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-3 w-3 text-primary" />
            </div>
            <span className="font-medium text-foreground">
              {article.expand?.author?.name || article.expand?.author?.email?.split('@')[0] || t('stories.anonymous', 'Anonymous')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticlePreview;
