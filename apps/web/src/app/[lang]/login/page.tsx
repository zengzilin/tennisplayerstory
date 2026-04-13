import { getTranslations } from 'next-intl/server';
import LoginPageClient from './LoginPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Login',
    description: 'Sign in to your TennisHub account.',
  };
}

export default async function LoginPage({ params }) {
  const { lang } = await params;
  return <LoginPageClient lang={lang as LangCode} />;
}
