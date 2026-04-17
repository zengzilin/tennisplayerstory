import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  status: string;
  tags: string[];
  coverImage: string;
  viewCount: number;
  created: string;
  updated: string;
  publishedAt: string | null;
}

export const useStoryData = () => {
  const [stories, setStories] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/articles?status=approved&sort=-created');
      setStories(data.items || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof Error ? err.message : 'Error fetching stories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return { stories, loading, error, refetch: fetchStories };
};
