import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const parseRecentResults = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map((item) => String(item)) : [];
    } catch {
      return value ? [value] : [];
    }
  }

  return [];
};

const normalizeSource = (source) => {
  const normalized = String(source || '').trim().toLowerCase();
  return normalized || 'unknown';
};

const getInitials = (name) => {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TP';
};

export const normalizePlayerRecord = (record) => {
  const ranking = Number(record?.ranking);
  const points = Number(record?.points);
  const age = Number(record?.age);
  const source = normalizeSource(record?.source);
  const lastUpdated = record?.last_updated || record?.updated || record?.created || null;

  return {
    ...record,
    id: record?.id,
    name: record?.name || 'Unknown Player',
    ranking: Number.isFinite(ranking) && ranking > 0 ? ranking : null,
    rankingDisplay: Number.isFinite(ranking) && ranking > 0 ? `#${ranking}` : '—',
    country: record?.country || 'Unknown',
    points: Number.isFinite(points) ? points : null,
    pointsDisplay: Number.isFinite(points) ? points.toLocaleString() : '—',
    age: Number.isFinite(age) && age > 0 ? age : null,
    ageDisplay: Number.isFinite(age) && age > 0 ? String(age) : '—',
    source,
    sourceLabel: source === 'unknown' ? 'N/A' : source.toUpperCase(),
    profileUrl: record?.profile_url || record?.profileUrl || '',
    recentResults: parseRecentResults(record?.recent_results),
    lastUpdated,
    lastUpdatedDisplay: formatDate(lastUpdated) || '—',
    initials: getInitials(record?.name),
  };
};

export const usePlayerData = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPlayers = async () => {
      try {
        console.log('usePlayerData: Fetching all players from PocketBase...');
        const data = await apiFetch('/api/players?sort=ranking');
        const result = data.items;

        const normalizedPlayers = result
          .map(normalizePlayerRecord)
          .sort((a, b) => {
            if (a.ranking === null) return 1;
            if (b.ranking === null) return -1;
            return a.ranking - b.ranking;
          });

        console.log(`usePlayerData: Successfully fetched ${normalizedPlayers.length} players total.`, {
          atp: normalizedPlayers.filter((player) => player.source === 'atp').length,
          wta: normalizedPlayers.filter((player) => player.source === 'wta').length,
          itf: normalizedPlayers.filter((player) => player.source === 'itf').length,
        });

        if (!cancelled) {
          setPlayers(normalizedPlayers);
        }
      } catch (err) {
        console.error('usePlayerData: Failed to fetch players:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPlayers();
    return () => {
      cancelled = true;
    };
  }, []);

  return { players, loading };
};

export const usePlayerDetail = (playerId) => {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPlayer = async () => {
      if (!playerId) {
        setPlayer(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const record = await apiFetch(`/api/players/${playerId}`);

        if (!cancelled) {
          setPlayer(normalizePlayerRecord(record));
        }
      } catch (err) {
        console.error('usePlayerDetail: Failed to fetch player:', err);
        if (!cancelled) {
          setPlayer(null);
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlayer();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  return { player, loading, error };
};
