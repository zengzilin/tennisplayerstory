import { redirect } from 'next/navigation';

export default async function TermsOfServiceRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/terms`);
}