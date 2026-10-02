import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useRankingData = () => {
  const [rankings, setRankings] = useState({ atp: [], wta: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRankings = async () => {
      try {
        const atpFilter = '(source = "atp" && ranking > 0) || (source = "ATP" && ranking > 0)';
        const wtaFilter = '(source = "wta" && ranking > 0) || (source = "WTA" && ranking > 0)';
        
        console.log(`[DEBUG] useRankingData: Executing ATP query with filter: '${atpFilter}'`);
        console.log(`[DEBUG] useRankingData: Executing WTA query with filter: '${wtaFilter}'`);
        
        const [atpResult, wtaResult] = await Promise.all([
          pb.collection('players').getFullList({
            filter: atpFilter,
            sort: 'ranking',
            $autoCancel: false,
          }),
          pb.collection('players').getFullList({
            filter: wtaFilter,
            sort: 'ranking',
            $autoCancel: false,
          }),
        ]);

        console.log('[DEBUG] useRankingData: ATP raw results count:', atpResult.length);
        if (atpResult.length > 0) {
          console.log('[DEBUG] useRankingData: ATP sample source values:', atpResult.slice(0, 3).map(p => p.source));
        }

        console.log('[DEBUG] useRankingData: WTA raw results count:', wtaResult.length);
        if (wtaResult.length > 0) {
          console.log('[DEBUG] useRankingData: WTA sample source values:', wtaResult.slice(0, 3).map(p => p.source));
        }

        if (!cancelled) {
          const toRankingRow = (p, i) => ({
            id: p.id,
            position: p.ranking || i + 1,
            name: p.name,
            country: p.country,
            points: p.points,
            tournaments: p.tournaments ?? null,
            trend: p.previous_ranking ? (p.previous_ranking > p.ranking ? 'up' : p.previous_ranking < p.ranking ? 'down' : 'same') : 'same',
            source: p.source.toLowerCase()
          });

          setRankings({
            atp: atpResult.map(toRankingRow),
            wta: wtaResult.map(toRankingRow),
          });
        }
      } catch (err) {
        console.error('[DEBUG] useRankingData: Failed to fetch rankings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRankings();
    return () => { cancelled = true; };
  }, []);

  return { rankings, loading };
};