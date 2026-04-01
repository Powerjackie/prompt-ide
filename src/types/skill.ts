import type { BenchmarkRun } from "@/types/benchmark"
import type { PromptVersion } from "@/types/prompt-version"
import type { Variable } from "@/types/prompt"

export type SkillStatus = "draft" | "active" | "archived"
export type SkillSchemaMap = Record<string, string>
export type SkillHealthState = "ready" | "watch" | "setup"
export type SkillSortMode = "health" | "updated" | "production"

export interface SkillReference {
  id: string
  title: string
  description?: string
  subtitle?: string
  href: string
}

export interface Skill {
  id: string
  name: string
  description: string
  goal: string
  status: SkillStatus
  entryPromptId: string
  collectionId: string | null
  recommendedModel: string
  inputSchema: SkillSchemaMap
  outputSchema: SkillSchemaMap
  notes: string
  createdAt: string
  updatedAt: string
  entryPrompt: SkillReference
  collection: SkillReference | null
}

export interface SkillHealthSummary {
  state: SkillHealthState
  hasBaseline: boolean
  hasBenchmark: boolean
  hasRecentRun: boolean
  baselineVersionNumber: number | null
  benchmarkScore: number | null
  recommendedForProduction: boolean
  recentRunRiskLevel: string | null
  recentRunConfidence: number | null
  recentRunCreatedAt: string | null
}

export interface SkillListItem extends Skill {
  health: SkillHealthSummary
}

export interface SkillDetail {
  skill: Skill
  latestBenchmark: BenchmarkRun | null
  baselineVersion: PromptVersion | null
  recentRuns: SkillRunRecord[]
  health: SkillHealthSummary
}

export interface SkillRunPreset {
  id: string
  name: string
  values: Record<string, string>
  updatedAt: string
}

export interface SkillRunRecord {
  id: string
  values: Record<string, string>
  renderedPrompt: string
  summary: string
  riskLevel: string
  confidence: number
  createdAt: string
}

export interface SkillRunContext {
  skill: Skill
  entryPromptContent: string
  entryPromptVariables: Variable[]
  baselineVersion: PromptVersion | null
  latestBenchmark: BenchmarkRun | null
  health: SkillHealthSummary
  recentValues: Record<string, string> | null
  presets: SkillRunPreset[]
  recentRuns: SkillRunRecord[]
}

export interface SkillFormInput {
  name: string
  description?: string
  goal?: string
  status?: SkillStatus
  entryPromptId: string
  collectionId?: string | null
  recommendedModel?: string
  inputSchema?: SkillSchemaMap
  outputSchema?: SkillSchemaMap
  notes?: string
}
