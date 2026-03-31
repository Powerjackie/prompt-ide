const encoder = new TextEncoder()
const AUTH_TOKEN_SCOPE = "prompt-ide-auth-v1"

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

async function createSignedToken(secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(AUTH_TOKEN_SCOPE))
  return toHex(new Uint8Array(signature))
}

export async function buildAuthToken() {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) return null

  return createSignedToken(secret)
}

export async function isValidAuthToken(token?: string) {
  if (!token) return false

  const expectedToken = await buildAuthToken()
  if (!expectedToken) return false

  return safeEqual(token, expectedToken)
}
