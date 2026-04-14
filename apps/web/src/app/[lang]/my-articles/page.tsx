import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import MyArticlesPageClient from './MyArticlesPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }: { params: Promise<{ lang: LangCode }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'articles' });
  return {
    title: `${t('myArticles')} - TennisHub`,
    description: 'Manage your submitted articles.',
  };
}

export default async function MyArticlesPage({ params }: { params: Promise<{ lang: LangCode }> }) {
  const { lang } = await params;
  return <MyArticlesPageClient lang={lang} />;
}
