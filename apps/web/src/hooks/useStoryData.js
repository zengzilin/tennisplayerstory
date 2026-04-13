import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

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
      const records = await pb.collection('articles').getList(1, 50, {
        filter: 'status="approved"',
        expand: 'author',
        sort: '-created',
        $autoCancel: false
      });
      setStories(records.items);
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
