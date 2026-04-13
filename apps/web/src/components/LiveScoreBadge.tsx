"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';

type MatchStatus = 'Live' | 'Upcoming' | 'Completed' | string;

const LiveScoreBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Live':
        return {
          variant: 'default' as const,
          className: 'bg-accent text-accent-foreground animate-pulse',
          text: 'Live'
        };
      case 'Upcoming':
        return {
          variant: 'secondary' as const,
          className: 'bg-secondary text-secondary-foreground',
          text: 'Upcoming'
        };
      case 'Completed':
        return {
          variant: 'outline' as const,
          className: 'border-border text-muted-foreground',
          text: 'Completed'
        };
      default:
        return {
          variant: 'secondary' as const,
          className: '',
          text: status
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.text}
    </Badge>
  );
};

export default LiveScoreBadge;
