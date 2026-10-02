import * as cheerio from 'cheerio';

export const rankingSources = {
  atp: 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/rankings',
  wta: 'https://www.wtatennis.com/rankings/singles',
};

const integer = text => Number(String(text).replace(/,/g, '').trim());

// Reject incomplete/challenge pages before any database writes.
export function validateRankings(players) {
  if (players.length < 50 || players.some(player =>
    !player.name || !player.country || !Number.isInteger(player.ranking) || player.ranking < 1 ||
    !Number.isFinite(player.points) || player.points < 0)) {
    throw new Error('Incomplete or invalid rankings feed');
  }
  const ranks = new Set(players.map(player => player.ranking));
  const names = new Set(players.map(player => player.name));
  if (ranks.size !== players.length || names.size !== players.length ||
    Array.from({ length: 50 }, (_, index) => index + 1).some(rank => !ranks.has(rank))) {
    throw new Error('Duplicate or missing ranking rows');
  }
  return players;
}

export function parseEspnRankings(payload, source = 'atp') {
  const ranking = payload.rankings?.find(item => item.type === source);
  if (!ranking?.ranks) throw new Error(`Missing ${source} rankings`);
  return validateRankings(ranking.ranks.map(row => ({
    name: row.athlete.displayName,
    ranking: row.current,
    previous_ranking: row.previous ?? null,
    points: row.points,
    country: row.athlete.flagAltText || row.athlete.citizenshipCountry,
    age: row.athlete.age ?? null,
    imageUrl: row.athlete.headshot || '',
    profile_url: row.athlete.links?.find(link => link.rel?.includes('playercard'))?.href || '',
    external_id: row.athlete.id,
    source,
    source_url: rankingSources[source],
    ranking_date: ranking.update || null,
  })));
}

export function parseWtaRankings(html) {
  const $ = cheerio.load(html);
  const rankingDate = $('[data-rankings-date]').first().attr('data-rankings-date') || null;
  const players = $('tr.player-row[data-player-name]').map((index, element) => {
    const row = $(element);
    return {
      name: row.attr('data-player-name').trim(),
      ranking: integer(row.find('.player-row__rank').text()),
      points: integer(row.find('.player-row__cell--points').text()),
      country: row.find('.player-cell__country').text().trim(),
      age: integer(row.find('.player-row__cell--age').text()) || null,
      tournaments: integer(row.find('.player-row__cell--tournaments').text()) || null,
      external_id: row.attr('data-player-id'),
      source: 'wta',
      source_url: rankingSources.wta,
      ranking_date: rankingDate,
    };
  }).get();
  return validateRankings(players);
}

export async function fetchRankings(source) {
  if (!rankingSources[source]) throw new Error(`Unsupported tour: ${source}`);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(rankingSources[source], {
        signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' },
      });
      if (!response.ok || response.status === 202) throw new Error(`Rankings HTTP ${response.status}`);
      return source === 'atp'
        ? parseEspnRankings(await response.json(), source)
        : parseWtaRankings(await response.text());
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}
