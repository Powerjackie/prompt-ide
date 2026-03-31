"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, buildAuthToken } from "@/lib/auth"
import type { AuthActionState } from "@/types/auth"

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const configuredPassword = process.env.ADMIN_PASSWORD
  if (!configuredPassword) {
    return { error: "configError" }
  }

  const password = formData.get("password")
  if (typeof password !== "string" || password !== configuredPassword) {
    return { error: "invalidPassword" }
  }

  const authToken = await buildAuthToken()
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
