import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import PlayerDetailPageClient from './PlayerDetailPageClient';
import { apiFetch } from '@/lib/api';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;

  try {
    const player = await apiFetch(`/api/players/${id}`);
    const localizedPlayersSegment: Record<LangCode, string> = {
      en: 'players',
      zh: '球员',
      ja: 'プレイヤー',
      es: 'jugadores',
      fr: 'joueurs',
    };
    const segment = localizedPlayersSegment[lang as LangCode] || 'players';

    return {
      title: player?.name || 'Player Not Found',
      description: player
        ? `${player.name} — ${player.sourceLabel || 'tennis'} player from ${player.country || 'Unknown'}.`
        : 'Player not found.',
      alternates: {
        canonical: `/${lang}/${segment}/${id}`,
      },
    };
  } catch {
    return {
      title: 'Player Not Found',
      description: 'We could not find the player you were looking for.',
    };
  }
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  return <PlayerDetailPageClient lang={lang as LangCode} playerId={id} />;
}
