import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh", "ja", "es", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
});
