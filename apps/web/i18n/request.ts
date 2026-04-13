import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !["en", "zh", "ja", "es", "fr"].includes(locale)) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`../src/i18n/locales/${locale}.json`)).default,
  };
});
