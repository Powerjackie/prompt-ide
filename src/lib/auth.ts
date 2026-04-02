import type { AuthRole, AuthSession, AuthzSnapshot } from "@/types/auth"
import { guestAuthzSnapshot } from "@/types/auth"

const encoder = new TextEncoder()
const AUTH_TOKEN_SCOPE = "prompt-ide-auth-v2"

export const AUTH_COOKIE_NAME = "auth_token"
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false

  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return mismatch === 0
}

function getSecretForRole(role: AuthRole) {
  if (role === "admin") {
    return process.env.ADMIN_PASSWORD ?? null
  }

  return process.env.MEMBER_PASSWORD ?? null
}

async function createSignedToken(role: AuthRole, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${AUTH_TOKEN_SCOPE}:${role}`)
  )

  return toHex(new Uint8Array(signature))
}

export function resolveRoleForPassword(password: string): AuthRole | null {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminPassword && safeEqual(password, adminPassword)) {
    return "admin"
  }

  const memberPassword = process.env.MEMBER_PASSWORD
  if (memberPassword && safeEqual(password, memberPassword)) {
    return "member"
  }

  return null
}

export async function buildAuthToken(role: AuthRole) {
  const secret = getSecretForRole(role)
  if (!secret) return null

  const signature = await createSignedToken(role, secret)
  return `${role}.${signature}`
}

export async function getAuthSessionFromToken(token?: string): Promise<AuthSession | null> {
  if (!token) return null

  const [rawRole, signature] = token.split(".")
  if (!rawRole || !signature) return null
  if (rawRole !== "admin" && rawRole !== "member") return null

  const secret = getSecretForRole(rawRole)
  if (!secret) return null

  const expectedSignature = await createSignedToken(rawRole, secret)
  if (!safeEqual(signature, expectedSignature)) {
    return null
  }

  return { role: rawRole }
}

export async function isValidAuthToken(token?: string) {
  return (await getAuthSessionFromToken(token)) !== null
}

export function createAuthzSnapshot(session: AuthSession | null): AuthzSnapshot {
  if (!session) {
    return guestAuthzSnapshot
  }

  const isAdmin = session.role === "admin"

  return {
    isAuthenticated: true,
    role: session.role,
    canDeleteAssets: isAdmin,
    canManageSettings: isAdmin,
  }
}
