import { getTranslations } from 'next-intl/server';
import MyArticlesPageClient from './MyArticlesPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'My Articles',
    description: 'Manage your submitted articles.',
  };
}

export default async function MyArticlesPage({ params }) {
  const { lang } = await params;
  return <MyArticlesPageClient lang={lang as LangCode} />;
}
