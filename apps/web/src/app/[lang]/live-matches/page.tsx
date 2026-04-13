import { getTranslations } from 'next-intl/server';
import LiveMatchesPageClient from '../LiveMatchesPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'home' });
  return {
    title: 'Live Matches',
    description: 'Watch live tennis match scores from around the world.',
  };
}

export default async function LiveMatchesPage({ params }) {
  const { lang } = await params;
  return <LiveMatchesPageClient lang={lang as LangCode} />;
}
