import { getTranslations } from 'next-intl/server';
import AdminArticlesClient from './AdminArticlesClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Admin Articles',
    description: 'Moderate user-submitted articles.',
  };
}

export default async function AdminArticlesPage({ params }) {
  const { lang } = await params;
  return <AdminArticlesClient lang={lang as LangCode} />;
}
