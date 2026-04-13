import { getTranslations } from 'next-intl/server';
import RankingsPageClient from './RankingsPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Rankings',
    description: 'Live ATP and WTA tennis rankings.',
  };
}

export default async function RankingsPage({ params }) {
  const { lang } = await params;
  return <RankingsPageClient lang={lang as LangCode} />;
}
