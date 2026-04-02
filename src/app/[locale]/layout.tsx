import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { getViewerAuthz } from "@/lib/action-auth"
import { AuthzProvider } from "@/components/auth/authz-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/layout/app-shell"

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
          <AppShell>{children}</AppShell>
        </AuthzProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
