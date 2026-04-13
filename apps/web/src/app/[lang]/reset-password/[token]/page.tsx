import ResetPasswordPageClient from './ResetPasswordPageClient';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

export async function generateMetadata({ params }) {
  return {
    title: 'Reset Password',
    description: 'Create a new password for your account.',
  };
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ lang: string; token: string }> }) {
  const { lang, token } = await params;
  return <ResetPasswordPageClient lang={lang as LangCode} token={token} />;
}
