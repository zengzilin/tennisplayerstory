import { getTranslations } from 'next-intl/server';
import PlayersPageClient from './PlayersPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Players',
    description: 'Browse tennis players from ATP and WTA tours.',
  };
}

export default async function PlayersPage({ params }) {
  const { lang } = await params;
  return <PlayersPageClient lang={lang as LangCode} />;
}
