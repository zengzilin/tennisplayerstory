import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

/**
 * @returns {{ stories: any[], loading: boolean, error: string | null, refetch: () => void }}
 */
export const useStoryData = () => {
  const [stories, setStories] = /** @type {any[]} */ ([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = /** @type {string | null} */ (null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/articles?status=approved&sort=-created');
      setStories(data.items);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err.message || 'Error fetching stories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return { stories, loading, error, refetch: fetchStories };
};
