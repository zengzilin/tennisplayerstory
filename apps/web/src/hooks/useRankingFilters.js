import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { readRankingFilters, filterRankingRows } from '@/lib/rankingFilters';

export const useRankingFilters = (atpData = [], wtaData = [], countryName) => {
  const [params, setParams] = useSearchParams();
  // Keep rapid consecutive filter changes from using an earlier URL snapshot.
  const latestParams = useRef(params);
  useEffect(() => { latestParams.current = params; }, [params]);
  const filters = readRankingFilters(params);
  const rows = filters.source === 'atp' ? atpData : wtaData;
  const filtered = filterRankingRows(rows, filters, countryName);
  const totalPages = Math.max(1, Math.ceil(filtered.length / filters.limit));
  const page = Math.min(filters.page, totalPages);
  const change = (values, replace = false) => {
    const next = new URLSearchParams(latestParams.current);
    for (const [key, value] of Object.entries(values)) {
      if (value === '' || value === 'all') next.delete(key);
      else next.set(key, String(value));
    }
    if (!('page' in values)) next.delete('page');
    latestParams.current = next;
    setParams(next, { replace, preventScrollReset: true });
  };
  return {
    ...filters, page, totalPages, totalResults: filtered.length,
    countries: [...new Set(rows.map(row => row.country).filter(Boolean))].sort((a, b) => countryName(a).localeCompare(countryName(b))),
    filteredData: filtered.slice((page - 1) * filters.limit, page * filters.limit),
    setSearch: value => change({ q: value }, true),
    setSource: value => change({ tour: value, country: '' }),
    setSortBy: value => change({ sort: value }),
    setCountry: value => change({ country: value }),
    setRange: value => change({ top: value }),
    setLimit: value => change({ size: value }),
    setPage: value => change({ page: Math.min(totalPages, Math.max(1, value)) }),
    resetFilters: () => {
      const next = new URLSearchParams({ tour: filters.source });
      latestParams.current = next;
      setParams(next, { preventScrollReset: true });
    },
  };
};
