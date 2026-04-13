import { getTranslations } from 'next-intl/server';
import TermsPageClient from './TermsPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Terms of Service',
    description: 'TennisHub Terms of Service.',
  };
}

export default async function TermsPage({ params }) {
  const { lang } = await params;
  return <TermsPageClient lang={lang as LangCode} />;
}
