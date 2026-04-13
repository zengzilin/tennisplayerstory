import { getTranslations } from 'next-intl/server';
import AdminDashboardClient from './AdminDashboardClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Admin Dashboard',
    description: 'TennisHub admin dashboard.',
  };
}

export default async function AdminDashboardPage({ params }) {
  const { lang } = await params;
  return <AdminDashboardClient lang={lang as LangCode} />;
}
