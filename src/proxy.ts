import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, isValidAuthToken } from "@/lib/auth"
import { routing } from "./i18n/routing"

const handleI18nRouting = createMiddleware(routing)

function getLocaleFromPathname(pathname: string) {
  const locale = pathname.split("/")[1]
  return routing.locales.includes(locale as "zh" | "en")
    ? locale
    : routing.defaultLocale
}

function isLoginPath(pathname: string) {
  if (pathname === "/login") return true

  const segments = pathname.split("/").filter(Boolean)
  return (
    segments.length >= 2 &&
    routing.locales.includes(segments[0] as "zh" | "en") &&
    segments[1] === "login"
  )
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isLoginPath(pathname)) {
    return handleI18nRouting(request)
  }

  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!(await isValidAuthToken(authToken))) {
    const locale = getLocaleFromPathname(pathname)
    const loginUrl = new URL(`/${locale}/login`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  return handleI18nRouting(request)
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
