import type { AgentReason } from "@/types/agent"

interface RiskResult {
  riskLevel: "low" | "medium" | "high"
  reasons: AgentReason[]
  matchedRules: string[]
  detectedPII: string[]
}

const PII_PATTERNS: [RegExp, string][] = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, "email"],
  [/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, "ssn"],
  [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, "creditCard"],
  [/\b(sk|pk|api|key|token|secret|password)[-_]?[a-zA-Z0-9]{16,}\b/i, "apiKey"],
  [/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, "ipAddress"],
]

const INJECTION_PATTERNS: [RegExp, string][] = [
  [/ignore\s+(all\s+)?previous\s+instructions/i, "ignoreInstructions"],
  [/forget\s+(all\s+)?previous/i, "forgetPrevious"],
  [/you\s+are\s+now\s+(?:DAN|a\s+new\s+AI)/i, "jailbreak"],
  [/system:\s*/i, "systemInjection"],
  [/\[INST\]|\[\/INST\]|<\|im_start\|>/i, "formatInjection"],
  [/pretend\s+(?:you(?:'re| are)|that)\s+(?:not|no\s+longer)/i, "pretendBypass"],
  [/bypass\s+(?:your|the)\s+(?:restrictions|rules|guidelines)/i, "bypassRules"],
]

export function assessRisk(content: string): RiskResult {
  const reasons: AgentReason[] = []
  const matchedRules: string[] = []
  const detectedPII: string[] = []
  let score = 0

  // PII detection
  for (const [pattern, label] of PII_PATTERNS) {
    if (pattern.test(content)) {
      detectedPII.push(label)
      reasons.push({ key: "detectedPII", params: { type: label } })
      matchedRules.push(`pii:${label}`)
      score += 2
    }
  }

  // Injection detection
  for (const [pattern, label] of INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      reasons.push({ key: "injectionPattern", params: { pattern: label } })
      matchedRules.push(`injection:${label}`)
      score += 3
    }
  }

  let riskLevel: RiskResult["riskLevel"] = "low"
  if (score >= 5) riskLevel = "high"
  else if (score >= 2) riskLevel = "medium"

  return { riskLevel, reasons, matchedRules, detectedPII }
}
