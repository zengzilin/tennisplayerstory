import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import WriteArticlePageClient from './WriteArticlePageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }: { params: Promise<{ lang: LangCode }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'articles' });
  return {
    title: `${t('writeTitle')} - TennisHub`,
    description: 'Share your tennis stories with the community.',
  };
}

export default async function WriteArticlePage({ params }: { params: Promise<{ lang: LangCode }> }) {
  const { lang } = await params;
  return <WriteArticlePageClient lang={lang} />;
}
