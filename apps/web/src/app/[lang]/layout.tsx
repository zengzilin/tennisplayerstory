import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "zh" }, { lang: "ja" }, { lang: "es" }, { lang: "fr" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "common" });

  return {
    title: {
      default: "TennisHub",
      template: `%s | TennisHub`,
    },
    description: t("loading"),
    alternates: {
      languages: {
        en: "/en",
        zh: "/zh",
        ja: "/ja",
        es: "/es",
        fr: "/fr",
      },
    },
  };
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

  const messages = await getMessages();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
