import { MetadataRoute } from 'next';
import PocketBase from 'pocketbase';

const LANGS = ['en', 'zh', 'ja', 'es', 'fr'] as const;
type LangCode = (typeof LANGS)[number];

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tennishub.com';

const PUBLIC_STATIC_SUFFIXES = [
  { suffix: '', changefreq: 'daily', priority: '1.0' },
  { suffix: 'live-matches', changefreq: 'hourly', priority: '0.9' },
  { suffix: 'login', changefreq: 'weekly', priority: '0.5' },
  { suffix: 'signup', changefreq: 'weekly', priority: '0.5' },
];

const LOCALIZED_ROUTE_KEYS: Array<{ key: string; routes: Record<LangCode, string> }> = [
  {
    key: 'players',
    routes: { en: 'players', zh: '球员', ja: 'プレイヤー', es: 'jugadores', fr: 'joueurs' },
  },
  {
    key: 'rankings',
    routes: { en: 'rankings', zh: '排名', ja: 'ランキング', es: 'clasificaciones', fr: 'classements' },
  },
  {
    key: 'stories',
    routes: { en: 'stories', zh: '故事', ja: 'ストーリー', es: 'historias', fr: 'histoires' },
  },
];

function formatLastMod(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().split('T')[0]!;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date().toISOString().split('T')[0]!;
  const urls: MetadataRoute.Sitemap = [];

  // Fetch players from PocketBase
  let players: Array<{ id: string; updated?: string; created?: string; last_updated?: string }> = [];
  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090');
    const records = await pb.collection('players').getFullList({
      fields: 'id,updated,created,last_updated',
      $autoCancel: false,
    });
    players = records;
  } catch (error) {
    console.error('[sitemap] Failed to fetch players:', error);
  }

  for (const lang of LANGS) {
    // Static pages
    for (const { suffix, changefreq, priority } of PUBLIC_STATIC_SUFFIXES) {
      const path = suffix ? `/${lang}/${suffix}` : `/${lang}`;
      urls.push({
        url: `${BASE_URL}${path}`,
        lastModified: today,
        changeFrequency: changefreq as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: parseFloat(priority),
      });
    }

    // Localized route pages (list pages)
    for (const { routes } of LOCALIZED_ROUTE_KEYS) {
      const segment = routes[lang];
      const path = `/${lang}/${segment}`;
      urls.push({
        url: `${BASE_URL}${path}`,
        lastModified: today,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Player detail pages
    const playersSegment = LOCALIZED_ROUTE_KEYS.find((r) => r.key === 'players')?.routes[lang] ?? 'players';
    for (const player of players) {
      const path = `/${lang}/${playersSegment}/${player.id}`;
      urls.push({
        url: `${BASE_URL}${path}`,
        lastModified: formatLastMod(player.last_updated ?? player.updated ?? player.created, today),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return urls;
}
