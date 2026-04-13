import { getTranslations } from 'next-intl/server';
import PrivacyPageClient from './PrivacyPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Privacy Policy',
    description: 'TennisHub Privacy Policy.',
  };
}

export default async function PrivacyPage({ params }) {
  const { lang } = await params;
  return <PrivacyPageClient lang={lang as LangCode} />;
}
