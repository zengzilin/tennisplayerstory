import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header lang={lang as LangCode} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang as LangCode} />
    </div>
  );
}
