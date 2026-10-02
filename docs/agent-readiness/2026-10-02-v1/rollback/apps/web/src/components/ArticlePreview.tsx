// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Trophy } from 'lucide-react';
import { localizeArticle } from '@/lib/localizeArticle.js';

const ArticlePreview = ({ article, onTagClick, labels = {}, lang }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const localizedArticle = localizeArticle(article, lang);
  const content = localizedArticle.content || '';
  const playerName = localizedArticle.player_name || localizedArticle.playerName;
  const created = article.created || article.createdAt || article.created_at;
  const authorName = article.expand?.author?.name
    || article.author?.name
    || article.expand?.author?.email?.split('@')[0]
    || article.author
    || labels.anonymous
    || 'Anonymous';
  const tags = Array.isArray(localizedArticle.tags)
    ? localizedArticle.tags
    : String(localizedArticle.tags || '').split(',').map(tag => tag.trim()).filter(Boolean);
  const isLong = content.length > 220;
  const displayContent = isExpanded || !isLong ? content : `${content.substring(0, 220).trim()}...`;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(labels.locale || 'en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-all duration-300 border-border/50 h-full">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          {playerName ? (
            <Badge
              variant="outline"
              className="bg-muted/50 text-muted-foreground border-border cursor-pointer hover:bg-muted transition-colors"
              onClick={() => onTagClick?.(playerName)}
            >
              <Trophy className="h-3 w-3 mr-1" />
              {playerName}
            </Badge>
          ) : <span />}
          {created && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <time dateTime={created}>{formatDate(created)}</time>
            </div>
          )}
        </div>

        <h3 className="font-bold text-2xl leading-tight mb-4 text-foreground">
          {localizedArticle.title}
        </h3>

        <div className="text-muted-foreground leading-relaxed mb-2 whitespace-pre-wrap">
          {displayContent}
        </div>

        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary text-sm font-medium hover:underline mb-6 text-left w-fit"
          >
            {isExpanded ? (labels.hide || 'Hide') : (labels.expand || 'Read more')}
          </button>
        )}

        <div className="flex flex-wrap gap-2 mb-6 mt-auto pt-4">
          {tags.map(tag => (
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
              {authorName}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticlePreview;
