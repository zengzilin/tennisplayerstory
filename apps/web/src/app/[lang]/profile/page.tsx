import { getTranslations } from 'next-intl/server';
import ProfilePageClient from './ProfilePageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Profile',
    description: 'Manage your TennisHub profile.',
  };
}

export default async function ProfilePage({ params }) {
  const { lang } = await params;
  return <ProfilePageClient lang={lang as LangCode} />;
}
