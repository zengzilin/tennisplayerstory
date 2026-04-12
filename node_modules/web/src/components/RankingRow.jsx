import React from 'react';
import { Link } from 'react-router-dom';
import { TableCell, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLanguage, buildLocalizedPath } from '@/contexts/LanguageContext.jsx';

const RankingRow = ({ ranking }) => {
  const { currentLanguage } = useLanguage();
  const playerDetailPath = buildLocalizedPath(currentLanguage, 'players', ranking.id);

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
        <Link to={playerDetailPath} className="flex items-center gap-2 hover:text-primary transition-colors">
          <span className="font-semibold">{ranking.name}</span>
          <span className="text-sm text-muted-foreground">· {ranking.country}</span>
        </Link>
      </TableCell>
      <TableCell className="font-mono font-semibold">{ranking.pointsDisplay}</TableCell>
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
