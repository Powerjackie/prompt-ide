"use server"

import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME, isValidAuthToken } from "@/lib/auth"

export async function ensureAuthenticated() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  return isValidAuthToken(token)
}
