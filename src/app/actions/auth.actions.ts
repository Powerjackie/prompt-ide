"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, buildAuthToken, resolveRoleForPassword } from "@/lib/auth"
import type { AuthActionState } from "@/types/auth"

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: "configError" }
  }

  const password = formData.get("password")
  if (typeof password !== "string") {
    return { error: "invalidPassword" }
  }

  const role = resolveRoleForPassword(password)
  if (!role) {
    return { error: "invalidPassword" }
  }

  const authToken = await buildAuthToken(role)
  if (!authToken) {
    return { error: "configError" }
  }

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  })

  redirect("/")
}

export async function logoutAction(formData: FormData) {
  const localeValue = formData.get("locale")
  const locale = localeValue === "zh" ? "zh" : "en"

  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)

  redirect(`/${locale}/login`)
}
