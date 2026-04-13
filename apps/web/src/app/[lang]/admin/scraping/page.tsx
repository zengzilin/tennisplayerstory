import { getTranslations } from 'next-intl/server';
import AdminScrapingClient from './AdminScrapingClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Admin Scraping',
    description: 'Manage tennis data scraping.',
  };
}

export default async function AdminScrapingPage({ params }) {
  const { lang } = await params;
  return <AdminScrapingClient lang={lang as LangCode} />;
}
