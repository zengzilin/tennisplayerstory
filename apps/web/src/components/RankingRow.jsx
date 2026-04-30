import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const RankingRow = ({ ranking }) => {
  const getTrendIcon = () => {
    switch (ranking.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-accent" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-bold">{ranking.position}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-xl">{ranking.country}</span>
          <span className="font-semibold">{ranking.name}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono font-semibold">{ranking.points.toLocaleString()}</TableCell>
      <TableCell className="text-muted-foreground">{ranking.tournaments}</TableCell>
      <TableCell>
        <div className="flex items-center justify-center">
          {getTrendIcon()}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default RankingRow;