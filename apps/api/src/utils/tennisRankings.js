import * as cheerio from 'cheerio';
import { ATP_RANKINGS_URL, parseAtpRankings } from './atpRankings.js';

export const rankingSources = {
  atp: ATP_RANKINGS_URL,
  wta: 'https://www.wtatennis.com/rankings/singles',
};

const integer = text => Number(String(text).replace(/,/g, '').trim());

// Reject incomplete/challenge pages before any database writes.
export function validateRankings(players) {
  if (players.length < 50 || players.some(player =>
    !player.name || !Number.isInteger(player.ranking) || player.ranking < 1 ||
    !Number.isFinite(player.points) || player.points < 0)) {
    throw new Error('Incomplete or invalid rankings feed');
  }
  const ordered = [...players].sort((a, b) => a.ranking - b.ranking);
  const names = new Set(players.map(player => player.name));
  if (names.size !== players.length || ordered.some((player, index) =>
    player.ranking !== index + 1 && (index === 0 || player.ranking !== ordered[index - 1].ranking))) {
    throw new Error('Duplicate or missing ranking rows');
  }
  return players;
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
        ? validateRankings(await parseAtpRankings(Buffer.from(await response.arrayBuffer())))
        : parseWtaRankings(await response.text());
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}
