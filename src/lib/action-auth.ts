import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME, createAuthzSnapshot, getAuthSessionFromToken } from "@/lib/auth"

export const AUTH_ERRORS = {
  unauthorized: "Unauthorized",
  adminRequired: "Administrator permission required",
} as const

export async function getAuthSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  return getAuthSessionFromToken(token)
}

export async function getViewerAuthz() {
  return createAuthzSnapshot(await getAuthSession())
}

export async function ensureAuthenticated() {
  return (await getAuthSession()) !== null
}

export async function ensureAdmin() {
  const session = await getAuthSession()
  return session?.role === "admin"
}
