import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

type AppLocale = (typeof routing.locales)[number]

function isAppLocale(locale: string): locale is AppLocale {
  return routing.locales.includes(locale as AppLocale)
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !isAppLocale(locale)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
