import { getTranslations } from 'next-intl/server';
import ForgotPasswordPageClient from './ForgotPasswordPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: 'Forgot Password',
    description: 'Reset your TennisHub account password.',
  };
}

export default async function ForgotPasswordPage({ params }) {
  const { lang } = await params;
  return <ForgotPasswordPageClient lang={lang as LangCode} />;
}
