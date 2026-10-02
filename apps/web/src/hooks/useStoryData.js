import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useSearchParams } from 'react-router-dom';

export const useStoryData = () => {
  const [searchParams] = useSearchParams();
  const requestedArticleId = searchParams.get('article');
  const selectedArticleId = /^[a-zA-Z0-9_-]{1,40}$/.test(requestedArticleId || '') ? requestedArticleId : null;
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      let selectedArticle = records.items.find(article => article.id === selectedArticleId);
      if (selectedArticleId && !selectedArticle) {
        const selection = await pb.collection('articles').getList(1, 1, {
          filter: `status="approved" && id="${selectedArticleId}"`,
          expand: 'author',
          $autoCancel: false,
        });
        selectedArticle = selection.items[0];
      }
      setStories(selectedArticle
        ? [selectedArticle, ...records.items.filter(article => article.id !== selectedArticle.id)]
        : records.items);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err.message || 'Error fetching stories');
    } finally {
      setLoading(false);
    }
  }, [selectedArticleId]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return { stories, loading, error, refetch: fetchStories };
};