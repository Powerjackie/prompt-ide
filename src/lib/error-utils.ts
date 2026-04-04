import { APIConnectionError } from "openai"

type AppLocale = "zh" | "en"

const FRIENDLY_NETWORK_ERRORS: Record<AppLocale, string> = {
  zh: "AI 服务暂时不可用，请稍后重试",
  en: "AI service temporarily unavailable, please try again later",
}

const NETWORK_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
])

const NETWORK_ERROR_PATTERNS = [
  /fetch failed/i,
  /\bnetwork\b/i,
  /\btimeout\b/i,
  /timed out/i,
  /\bdns\b/i,
  /connection/i,
  /econnreset/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /eai_again/i,
  /socket hang up/i,
]

function collectErrorCandidates(error: unknown): Array<Record<string, unknown>> {
  const queue: unknown[] = [error]
  const seen = new Set<unknown>()
  const candidates: Array<Record<string, unknown>> = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || typeof current !== "object" || seen.has(current)) {
      continue
    }

    seen.add(current)
    candidates.push(current as Record<string, unknown>)

    const cause = (current as { cause?: unknown }).cause
    if (cause && !seen.has(cause)) {
      queue.push(cause)
    }
  }

  return candidates
}

export function isNetworkActionError(error: unknown): boolean {
  if (error instanceof APIConnectionError) {
    return true
  }

  for (const candidate of collectErrorCandidates(error)) {
    const code = candidate.code
    if (typeof code === "string" && NETWORK_ERROR_CODES.has(code.toUpperCase())) {
      return true
    }

    const message = candidate.message
    if (
      typeof message === "string" &&
      NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message))
    ) {
      return true
    }
  }

  return false
}

export function formatActionError(error: unknown, locale: AppLocale = "en"): string {
  if (isNetworkActionError(error)) {
    return FRIENDLY_NETWORK_ERRORS[locale]
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Unknown error"
}
