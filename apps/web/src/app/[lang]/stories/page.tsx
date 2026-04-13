import { getTranslations } from 'next-intl/server';
import StoriesPageClient from './StoriesPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Stories',
    description: 'Read the latest tennis news and stories.',
  };
}

export default async function StoriesPage({ params }) {
  const { lang } = await params;
  return <StoriesPageClient lang={lang as LangCode} />;
}
