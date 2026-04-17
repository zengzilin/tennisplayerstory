import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { normalizePlayerRecord } from '@/hooks/usePlayerData';

export const useRankingData = () => {
  const [rankings, setRankings] = useState({ atp: [], wta: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRankings = async () => {
      try {
        console.log('useRankingData: Fetching ATP and WTA rankings...');

        const [atpResult, wtaResult] = await Promise.all([
          apiFetch('/api/players?source=atp&sort=ranking'),
          apiFetch('/api/players?source=wta&sort=ranking'),
        ]);

        console.log('useRankingData: Fetched ranking data:', {
          atpCount: atpResult.length,
          wtaCount: wtaResult.length,
        });

        if (!cancelled) {
          const toRankingRow = (record, index) => {
            const player = normalizePlayerRecord(record);

            return {
              ...player,
              position: player.ranking || index + 1,
              tournaments: '—',
              trend: 'same',
            };
          };

          setRankings({
            atp: atpResult.items.map(toRankingRow),
            wta: wtaResult.items.map(toRankingRow),
          });
        }
      } catch (err) {
        console.error('useRankingData: Failed to fetch rankings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRankings();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rankings, loading };
};
