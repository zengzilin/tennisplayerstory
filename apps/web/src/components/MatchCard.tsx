// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LiveScoreBadge from '@/components/LiveScoreBadge.tsx';
import { Clock } from 'lucide-react';

const MatchCard = ({ match }) => {
  const formatScore = (scores) => {
    return scores.join(' ');
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{match.tournament}</p>
            <p className="text-xs text-muted-foreground">{match.round}</p>
          </div>
          <LiveScoreBadge status={match.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{match.player1.country}</span>
              <span className="font-semibold">{match.player1.name}</span>
            </div>
            <div className="flex gap-2 font-mono font-bold text-lg">
              {match.score.player1.map((set, idx) => (
                <span key={idx} className={set > match.score.player2[idx] ? 'text-primary' : ''}>
                  {set}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{match.player2.country}</span>
              <span className="font-semibold">{match.player2.name}</span>
            </div>
            <div className="flex gap-2 font-mono font-bold text-lg">
              {match.score.player2.map((set, idx) => (
                <span key={idx} className={set > match.score.player1[idx] ? 'text-primary' : ''}>
                  {set}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border text-sm text-muted-foreground">
          <span>{match.court}</span>
          {match.startTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{match.startTime}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;