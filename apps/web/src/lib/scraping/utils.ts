import * as cheerio from 'cheerio';
import prisma from '@/lib/prisma';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface PlayerRankData {
  name: string;
  ranking: number;
  points: number | null;
  country: string | null;
  nationalityCode: string | null;
  age: number | null;
  source: 'atp' | 'wta' | 'itf';
  profileUrl: string | null;
}

export interface SyncResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  baseDelayMs = 1000
): Promise<Response> {
  const headers = {
    'User-Agent': DEFAULT_USER_AGENT,
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    ...options.headers,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) return response;

      // 429 = rate limited, retry with backoff
      if (response.status === 429 && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
        await sleep(delay);
        continue;
      }

      // For non-OK responses that aren't rate-limited, throw
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- ESPN ATP/WTA Ranking Parsing ---

export function parseEspnRankings(html: string, source: 'atp' | 'wta'): PlayerRankData[] {
  const $ = cheerio.load(html);
  const players: PlayerRankData[] = [];

  // ESPN rankings table structure
  $('table tbody tr, div.Table__TBody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 4) return;

    const ranking = parseInt($(cells.get(0)).text().trim(), 10);
    if (Number.isNaN(ranking)) return;

    const nameCell = $(cells.get(1));
    const name = nameCell.find('a, span').first().text().trim() || nameCell.text().trim();

    const pointsText = $(cells.get(3)).text().trim().replace(/,/g, '');
    const points = pointsText ? parseInt(pointsText, 10) : null;

    const countryCell = $(cells.get(2));
    const country = countryCell.find('img').attr('title') || countryCell.text().trim();

    let nationalityCode: string | null = null;
    const flagImg = countryCell.find('img').first();
    if (flagImg.length) {
      const src = flagImg.attr('src') || '';
      const match = src.match(/\/flags\/([a-z]{2})/i);
      nationalityCode = match ? match[1]!.toUpperCase() : null;
    }

    let profileUrl: string | null = null;
    const nameLink = nameCell.find('a').first();
    if (nameLink.length) {
      const href = nameLink.attr('href');
      if (href) profileUrl = href.startsWith('http') ? href : `https://www.espn.com${href}`;
    }

    let age: number | null = null;
    if (cells.length >= 5) {
      const ageText = $(cells.get(4)).text().trim();
      const ageNum = parseInt(ageText, 10);
      if (!Number.isNaN(ageNum)) age = ageNum;
    }

    if (name) {
      players.push({
        name,
        ranking,
        points,
        country,
        nationalityCode,
        age,
        source,
        profileUrl,
      });
    }
  });

  return players;
}

// --- WTATennis.com Ranking Parsing ---

export function parseWtaRankings(html: string): PlayerRankData[] {
  const $ = cheerio.load(html);
  const players: PlayerRankData[] = [];

  // WTATennis.com rankings table
  $('table tbody tr, .rankings-table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 4) return;

    const ranking = parseInt($(cells.get(0)).text().trim(), 10);
    if (Number.isNaN(ranking)) return;

    const nameCell = $(cells.get(1));
    const name = nameCell.text().trim();

    const pointsText = $(cells.get(3)).text().trim().replace(/,/g, '');
    const points = pointsText ? parseInt(pointsText, 10) : null;

    const countryCell = $(cells.get(2));
    const country = countryCell.text().trim();

    let profileUrl: string | null = null;
    const link = nameCell.find('a').first();
    if (link.length) {
      const href = link.attr('href');
      if (href) profileUrl = href.startsWith('http') ? href : `https://www.wtatennis.com${href}`;
    }

    let nationalityCode: string | null = null;
    const flagImg = countryCell.find('img').first();
    if (flagImg.length) {
      const src = flagImg.attr('src') || '';
      const match = src.match(/\/([a-z]{2})\.png$/i);
      nationalityCode = match ? match[1]!.toUpperCase() : null;
    }

    if (name) {
      players.push({
        name,
        ranking,
        points,
        country,
        nationalityCode,
        age: null,
        source: 'wta',
        profileUrl,
      });
    }
  });

  return players;
}

// --- Player Data Validation ---

export function validatePlayerData(
  player: PlayerRankData
): { valid: boolean; error?: string } {
  if (!player.name || player.name.trim().length === 0) {
    return { valid: false, error: 'Player name is required' };
  }
  if (player.ranking <= 0 || player.ranking > 10000) {
    return { valid: false, error: `Invalid ranking: ${player.ranking}` };
  }
  if (player.points !== null && (player.points < 0 || player.points > 20000)) {
    // Sanity check, some players can have 0 points
    return { valid: false, error: `Suspicious points value: ${player.points}` };
  }
  return { valid: true };
}

export function normalizePlayerForDb(player: PlayerRankData): Record<string, unknown> {
  return {
    name: player.name.trim(),
    ranking: player.ranking,
    points: player.points ?? 0,
    country: player.country ?? '',
    nationality_code: player.nationalityCode ?? '',
    age: player.age ?? 0,
    source: player.source,
    profile_url: player.profileUrl ?? '',
    ranking_display: `#${player.ranking}`,
    points_display: player.points !== null ? player.points.toLocaleString() : '0',
    source_label: player.source.toUpperCase(),
    last_updated: new Date().toISOString(),
  };
}

// --- Scrape Log ---

export interface ScrapeLogEntry {
  source: string;
  status: 'success' | 'failed' | 'partial';
  playerCount: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errorMessage?: string;
  duration: number;
}

export async function createScrapeLog(
  pb: import('pocketbase').default,
  entry: ScrapeLogEntry
): Promise<string> {
  const record = await pb.collection('scrape_logs').create({
    source: entry.source,
    status: entry.status,
    player_count: entry.playerCount,
    created_count: entry.createdCount,
    updated_count: entry.updatedCount,
    failed_count: entry.failedCount,
    error_message: entry.errorMessage ?? '',
    duration_ms: entry.duration,
  });
  return record.id;
}

export async function updateScrapeLog(
  pb: import('pocketbase').default,
  logId: string,
  updates: Partial<ScrapeLogEntry>
): Promise<void> {
  await pb.collection('scrape_logs').update(logId, {
    status: updates.status,
    player_count: updates.playerCount,
    created_count: updates.createdCount,
    updated_count: updates.updatedCount,
    failed_count: updates.failedCount,
    error_message: updates.errorMessage ?? '',
    duration_ms: updates.duration,
  });
}

// --- Prisma-based Sync Function ---

export async function scrapeAndSyncPlayers(
  source: 'atp' | 'wta' | 'itf'
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, failed: 0, errors: [] };

  let players: PlayerRankData[] = [];

  try {
    if (source === 'atp') {
      // Scrape ATP from ESPN
      const response = await fetchWithRetry('https://www.espn.com/tennis/rankings', {
        referer: 'https://www.espn.com/tennis/',
      });
      const html = await response.text();
      players = parseEspnRankings(html, 'atp');
    } else if (source === 'wta') {
      // Scrape WTA from wtatennis.com
      const response = await fetchWithRetry('https://www.wtatennis.com/rankings/singles', {
        referer: 'https://www.wtatennis.com/',
      });
      const html = await response.text();
      players = parseWtaRankings(html);
    } else if (source === 'itf') {
      // ITF uses ESPN WTA rankings (itftennis.com blocks server requests)
      const response = await fetchWithRetry('https://www.espn.com/tennis/rankings/_/type/wta', {
        referer: 'https://www.espn.com/tennis/',
      });
      const html = await response.text();
      players = parseEspnRankings(html, 'atp').map(p => ({ ...p, source: 'itf' }));
    }
  } catch (err) {
    result.failed = 1;
    result.errors.push(`Failed to fetch ${source} rankings: ${err}`);
    return result;
  }

  if (players.length === 0) {
    result.failed = 1;
    result.errors.push(`No players scraped from ${source}`);
    return result;
  }

  // Sync each player to database using Prisma
  for (const player of players) {
    const validation = validatePlayerData(player);
    if (!validation.valid) {
      result.failed++;
      result.errors.push(`${player.name}: ${validation.error}`);
      continue;
    }

    try {
      const normalized = normalizePlayerForDb(player);

      // Find existing player by name + source
      const existing = await prisma.player.findFirst({
        where: {
          name: player.name,
          source: player.source,
        },
      });

      if (existing) {
        // Update existing
        await prisma.player.update({
          where: { id: existing.id },
          data: {
            ranking: normalized.ranking,
            points: normalized.points,
            country: normalized.country,
            nationalityCode: normalized.nationalityCode,
            age: normalized.age,
            profileUrl: normalized.profileUrl,
            rankingDisplay: normalized.rankingDisplay,
            pointsDisplay: normalized.pointsDisplay,
            sourceLabel: normalized.sourceLabel,
            lastUpdated: new Date(),
          },
        });
        result.updated++;
      } else {
        // Create new
        await prisma.player.create({
          data: {
            name: normalized.name,
            ranking: normalized.ranking,
            points: normalized.points,
            country: normalized.country,
            nationalityCode: normalized.nationalityCode,
            age: normalized.age,
            source: normalized.source,
            profileUrl: normalized.profileUrl,
            rankingDisplay: normalized.rankingDisplay,
            pointsDisplay: normalized.pointsDisplay,
            sourceLabel: normalized.sourceLabel,
          },
        });
        result.created++;
      }
    } catch (err) {
      result.failed++;
      result.errors.push(`${player.name}: ${err}`);
    }
  }

  // Store total for logging
  (result as { total: number }).total = players.length;

  return result;
}
