export const normalizeRankingSearch = value => value.normalize('NFKD').replace(/\p{M}/gu, '').trim().toLowerCase();

export function readRankingFilters(params) {
  return {
    source: params.get('tour') === 'wta' ? 'wta' : 'atp',
    search: params.get('q') || '',
    country: params.get('country') || '',
    range: ['10', '50', '100'].includes(params.get('top')) ? params.get('top') : 'all',
    sortBy: ['points', 'name'].includes(params.get('sort')) ? params.get('sort') : 'rank',
    limit: [25, 50, 100].includes(Number(params.get('size'))) ? Number(params.get('size')) : 50,
    page: Math.max(1, Math.floor(Number(params.get('page')) || 1)),
  };
}

export function filterRankingRows(rows, filters, countryName = value => value) {
  const query = normalizeRankingSearch(filters.search);
  return rows.filter(player => (!filters.country || player.country === filters.country) &&
    (filters.range === 'all' || player.position <= Number(filters.range)) &&
    (!query || normalizeRankingSearch(`${player.name} ${player.country || ''} ${countryName(player.country)}`).includes(query)))
    .sort((a, b) => filters.sortBy === 'name' ? a.name.localeCompare(b.name) :
      filters.sortBy === 'points' ? b.points - a.points || a.position - b.position : a.position - b.position);
}
