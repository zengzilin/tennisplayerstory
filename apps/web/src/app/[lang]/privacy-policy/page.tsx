import { redirect } from 'next/navigation';

export default async function PrivacyPolicyRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/privacy`);
}