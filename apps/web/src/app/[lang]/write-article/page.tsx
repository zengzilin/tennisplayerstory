import { getTranslations } from 'next-intl/server';
import WriteArticlePageClient from './WriteArticlePageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Write Article',
    description: 'Share your tennis stories with the community.',
  };
}

export default async function WriteArticlePage({ params }) {
  const { lang } = await params;
  return <WriteArticlePageClient lang={lang as LangCode} />;
}
