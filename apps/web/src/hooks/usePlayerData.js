import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

export const usePlayerData = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await pb.collection('players').getList(1, 50, {
        sort: 'ranking',
        $autoCancel: false,
      });
      
      setPlayers(result.items || []);
    } catch (err) {
      console.error('Failed to fetch players:', err);
      setError(err.message || 'Failed to load players. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return { players, loading, error, refetch: fetchPlayers };
};