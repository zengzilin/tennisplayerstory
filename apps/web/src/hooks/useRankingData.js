import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useRankingData = () => {
  const [rankings, setRankings] = useState({ atp: [], wta: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const atpFilter = '(source = "atp" && ranking > 0) || (source = "ATP" && ranking > 0)';
        const wtaFilter = '(source = "wta" && ranking > 0) || (source = "WTA" && ranking > 0)';
        
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

        if (!cancelled) {
          const toRankingRow = (p, i) => ({
            id: p.id,
            position: p.ranking || i + 1,
            name: p.name,
            country: p.country,
            points: p.points,
            tournaments: p.tournaments ?? null,
            trend: p.previous_ranking ? (p.previous_ranking > p.ranking ? 'up' : p.previous_ranking < p.ranking ? 'down' : 'same') : null,
            source: p.source.toLowerCase()
          });

          setRankings({
            atp: atpResult.map(toRankingRow),
            wta: wtaResult.map(toRankingRow),
          });
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRankings();
    return () => { cancelled = true; };
  }, [attempt]);

  return { rankings, loading, error, retry: () => setAttempt(value => value + 1) };
};