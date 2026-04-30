import { useState, useMemo } from 'react';

export const useRankingFilters = (atpData = [], wtaData = []) => {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all'); // all, atp, wta
  const [sortBy, setSortBy] = useState('rank'); // rank, name, country, points
  const [page, setPage] = useState(1);
  const limit = 20;

  const filteredData = useMemo(() => {
    let combined = [];
    if (source === 'all') combined = [...atpData, ...wtaData];
    else if (source === 'atp') combined = [...atpData];
    else if (source === 'wta') combined = [...wtaData];

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      combined = combined.filter(p => 
        p.name.toLowerCase().includes(lowerSearch) || 
        (p.country && p.country.toLowerCase().includes(lowerSearch))
      );
    }

    combined.sort((a, b) => {
      if (sortBy === 'rank') return a.position - b.position;
      if (sortBy === 'points') return (b.points || 0) - (a.points || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '');
      return 0;
    });

    return combined;
  }, [atpData, wtaData, search, source, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / limit));
  
  // Ensure page is within bounds after filtering
  const safePage = Math.min(page, totalPages);
  
  const paginatedData = useMemo(() => {
    return filteredData.slice((safePage - 1) * limit, safePage * limit);
  }, [filteredData, safePage, limit]);

  return {
    search, setSearch,
    source, setSource,
    sortBy, setSortBy,
    page: safePage, setPage,
    totalPages,
    filteredData: paginatedData,
    totalResults: filteredData.length
  };
};