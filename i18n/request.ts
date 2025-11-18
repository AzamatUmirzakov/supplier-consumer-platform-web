import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "kz"; // Default locale; adjust as needed
  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
})