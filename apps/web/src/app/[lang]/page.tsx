import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HomePageClient from './HomePageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'home' });

  return {
    title: t('title'),
    description: t('metaDesc'),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return <HomePageClient lang={lang as LangCode} />;
}
