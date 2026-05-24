// @ts-nocheck

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import CountryFlag from '@/components/CountryFlag.tsx';
import RankBadge from '@/components/RankBadge.tsx';

const RankingsPreviewTable = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const result = await pb.collection('players').getList(1, 5, {
          sort: '-points',
          filter: "source='atp'", // Defaulting to ATP for the preview
          $autoCancel: false
        });
        setPlayers(result.items);
      } catch (error) {
        console.error("Failed to fetch players for preview", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopPlayers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (players.length === 0) return <div className="p-4 text-center text-muted-foreground">No rankings available.</div>;

  const maxPoints = Math.max(...players.map(p => p.points || 1));

  const renderTrend = (trend) => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border dark:border-slate-700 bg-card dark:bg-slate-800 shadow-sm">
      <Table className="min-w-[600px]">
        <TableHeader className="bg-muted/50 dark:bg-slate-900/50">
          <TableRow className="hover:bg-transparent border-b-border dark:border-b-slate-700">
            <TableHead className="w-16 text-center font-bold text-foreground dark:text-slate-300">Rank</TableHead>
            <TableHead className="font-bold text-foreground dark:text-slate-300">Player</TableHead>
            <TableHead className="font-bold text-foreground dark:text-slate-300 w-1/3">Points Overview</TableHead>
            <TableHead className="text-right font-bold text-foreground dark:text-slate-300 w-24">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => {
            const progressValue = ((player.points || 0) / maxPoints) * 100;
            // Simulated trend for visual richness
            const mockTrend = index === 0 ? 'same' : index === 1 ? 'up' : index === 4 ? 'down' : 'same';

            return (
              <TableRow 
                key={player.id} 
                className="group hover:bg-muted/40 dark:hover:bg-slate-700/50 transition-colors border-b-border/50 dark:border-b-slate-700/50"
              >
                <TableCell className="text-center font-medium">
                  <RankBadge rank={player.ranking || index + 1} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CountryFlag country={player.country} />
                    <Link 
                      to={`/players`} 
                      className="font-bold text-foreground dark:text-slate-100 hover:text-primary dark:hover:text-primary transition-colors text-base"
                    >
                      {player.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-medium text-foreground dark:text-slate-200">
                        {player.points?.toLocaleString() || 0}
                      </span>
                      <Trophy className="h-3.5 w-3.5 text-accent opacity-70" />
                    </div>
                    <Progress value={progressValue} className="h-2 bg-muted dark:bg-slate-700" indicatorClassName="bg-primary" />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    {renderTrend(mockTrend)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default RankingsPreviewTable;
