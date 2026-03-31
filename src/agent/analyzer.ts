import type { AgentAnalysisResult, AgentSummaryPart } from "@/types/agent"
import type { Prompt } from "@/types/prompt"
import { AGENT_CONFIG } from "./config"
import {
  extractVariables,
  classify,
  assessRisk,
  findDuplicates,
  normalize,
  generateTitle,
  generateDescription,
} from "./rules"

interface AnalyzeInput {
  content: string
  existingPrompts?: Prompt[]
  currentId?: string
}

export function analyzePrompt({ content, existingPrompts = [], currentId }: AnalyzeInput): AgentAnalysisResult {
  const config = AGENT_CONFIG

  // 1. Variables
  const variables = extractVariables(content)

  // 2. Classification
  const classification = classify(content)

  // 3. Risk
  const risk = assessRisk(content)

  // 4. Similarity / Duplicates
  const candidates = existingPrompts
    .filter((p) => p.id !== currentId && p.status !== "archived")
    .map((p) => ({ id: p.id, title: p.title, content: p.content }))
  const duplicates = findDuplicates(content, candidates, config.similarityThreshold)
    .slice(0, config.maxDuplicates)

  // 5. Normalization
  const normalizedContent = normalize(content)

  // 6. Title & description suggestion
  const suggestedTitle = generateTitle(content)
  const suggestedDescription = generateDescription(content)

  // 7. Module candidates (simple heuristic)
  const moduleCandidates: { type: string; content: string }[] = []
  const lower = content.toLowerCase()
  if (lower.includes("you are") || lower.includes("act as")) {
    const roleMatch = content.match(/(?:you are|act as)[^.!?\n]*/i)
    if (roleMatch) moduleCandidates.push({ type: "role", content: roleMatch[0].trim() })
  }
  if (lower.includes("must not") || lower.includes("do not") || lower.includes("never")) {
    const constraintMatch = content.match(/(?:must not|do not|never)[^.!?\n]*/i)
    if (constraintMatch) moduleCandidates.push({ type: "constraint", content: constraintMatch[0].trim() })
  }

  // 8. Status suggestion
  let suggestedStatus = "inbox"
  if (risk.riskLevel === "low" && duplicates.length === 0) suggestedStatus = "production"

  // 9. Confidence
  let confidence = config.confidenceBase
  if (classification.matchedRules.length > 0) confidence += 0.1
  if (variables.length > 0) confidence += 0.05
  if (risk.matchedRules.length > 0) confidence += 0.05
  confidence = Math.min(confidence, 0.95)

  // 10. Collect all matched rules
  const allRules = [
    ...classification.matchedRules,
    ...risk.matchedRules,
    ...(variables.length > 0 ? [`variables:extracted:${variables.length}`] : []),
    ...(duplicates.length > 0 ? [`similarity:duplicates:${duplicates.length}`] : []),
    ...(normalizedContent ? ["normalization:applied"] : []),
  ]

  const reviewRequired = risk.riskLevel !== "low" || duplicates.length > 0

  // Summary parts (translation-ready)
  const summaryParts: AgentSummaryPart[] = []
  summaryParts.push({ key: "summaryCategory", params: { category: classification.category } })
  if (variables.length > 0) summaryParts.push({ key: "summaryVariables", params: { count: variables.length } })
  if (risk.riskLevel !== "low") summaryParts.push({ key: "summaryRisk", params: { level: risk.riskLevel } })
  if (duplicates.length > 0) summaryParts.push({ key: "summaryDuplicates", params: { count: duplicates.length } })
  if (normalizedContent) summaryParts.push({ key: "summaryNormalize" })

  return {
    suggestedTitle,
    suggestedDescription,
    suggestedCategory: classification.category,
    suggestedTags: classification.tags,
    suggestedModel: classification.model,
    suggestedStatus,
    riskLevel: risk.riskLevel,
    confidence: Math.round(confidence * 100) / 100,
    extractedVariables: variables,
    duplicateCandidates: duplicates,
    moduleCandidates,
    normalizedContent,
    reviewRequired,
    summaryParts,
    reasons: risk.reasons,
    matchedRules: allRules,
    analysisVersion: config.analysisVersion,
    analyzedAt: new Date().toISOString(),
  }
}
