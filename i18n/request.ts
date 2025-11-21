import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // Read locale from cookie (set by client-side localStorage sync)
  const cookieStore = await cookies();
  let locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  // Validate locale
  const supportedLocales = ["en", "ru", "kz"];
  if (!supportedLocales.includes(locale)) {
    locale = "en";
  }

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
})