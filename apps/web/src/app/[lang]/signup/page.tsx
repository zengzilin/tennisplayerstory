import { getTranslations } from 'next-intl/server';
import SignupPageClient from './SignupPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Sign Up',
    description: 'Create your TennisHub account.',
  };
}

export default async function SignupPage({ params }) {
  const { lang } = await params;
  return <SignupPageClient lang={lang as LangCode} />;
}
