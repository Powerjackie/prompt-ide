import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { getViewerAuthz } from "@/lib/action-auth"
import { AuthzProvider } from "@/components/auth/authz-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/layout/app-shell"
import { HtmlLangSetter } from "@/components/layout/html-lang-setter"

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()
  const authz = await getViewerAuthz()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider
        defaultTheme="system"
      >
        <AuthzProvider initialAuthz={authz}>
          <HtmlLangSetter locale={locale} />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {locale === "zh" ? "跳过导航" : "Skip to main content"}
          </a>
          <AppShell>{children}</AppShell>
        </AuthzProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
