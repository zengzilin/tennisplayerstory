import { getTranslations } from 'next-intl/server';
import AdminPlayersClient from './AdminPlayersClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Admin Players',
    description: 'Manage tennis players.',
  };
}

export default async function AdminPlayersPage({ params }) {
  const { lang } = await params;
  return <AdminPlayersClient lang={lang as LangCode} />;
}
