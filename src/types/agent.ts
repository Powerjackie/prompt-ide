import type { Variable } from "./prompt"

export interface DuplicateCandidate {
  id: string
  title: string
  similarity: number
}

export interface ModuleCandidate {
  type: string
  content: string
}

/** A single reason entry — carries a translation key + optional params */
export interface AgentReason {
  key: string
  params?: Record<string, string | number>
}

/** A single summary segment — carries a translation key + optional params */
export interface AgentSummaryPart {
  key: string
  params?: Record<string, string | number>
}

export interface AgentAnalysisResult {
  suggestedTitle: string
  suggestedDescription: string
  suggestedCategory: string
  suggestedTags: string[]
  suggestedModel: string
  suggestedStatus: string
  riskLevel: "low" | "medium" | "high"
  confidence: number
  extractedVariables: Variable[]
  duplicateCandidates: DuplicateCandidate[]
  moduleCandidates: ModuleCandidate[]
  normalizedContent: string | null
  reviewRequired: boolean
  summaryParts: AgentSummaryPart[]
  reasons: AgentReason[]
  matchedRules: string[]
  analysisVersion: string
  analyzedAt: string
}
