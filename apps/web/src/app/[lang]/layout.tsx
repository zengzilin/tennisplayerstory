import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "zh" }, { lang: "ja" }, { lang: "es" }, { lang: "fr" }];
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!["en", "zh", "ja", "es", "fr"].includes(lang)) {
    notFound();
  }

  return <>{children}</>;
}
