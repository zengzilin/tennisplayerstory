import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AdminDashboardClient from './AdminDashboardClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }: { params: Promise<{ lang: LangCode }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'admin' });
  return {
    title: `${t('heading')} - TennisHub`,
    description: t('desc'),
  };
}

export default async function AdminDashboardPage({ params }: { params: Promise<{ lang: LangCode }> }) {
  const { lang } = await params;
  return <AdminDashboardClient lang={lang} />;
}
