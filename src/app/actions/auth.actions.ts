"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export type AuthActionError = "invalidPassword" | "configError" | null

export interface AuthActionState {
  error: AuthActionError
}

export const initialAuthState: AuthActionState = {
  error: null,
}

const AUTH_COOKIE_NAME = "auth_token"
const AUTH_COOKIE_VALUE = "authenticated"
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

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

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  })

  redirect("/")
}
