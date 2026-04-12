
import React from 'react';
import { Badge } from '@/components/ui/badge';

const LiveScoreBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Live':
        return {
          variant: 'default',
          className: 'bg-accent text-accent-foreground animate-pulse',
          text: 'Live'
        };
      case 'Upcoming':
        return {
          variant: 'secondary',
          className: 'bg-secondary text-secondary-foreground',
          text: 'Upcoming'
        };
      case 'Completed':
        return {
          variant: 'outline',
          className: 'border-border text-muted-foreground',
          text: 'Completed'
        };
      default:
        return {
          variant: 'secondary',
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
