import type { AgentAnalysisResult } from "@/types/agent"
import type { ModelType, PromptStatus, Variable } from "@/types/prompt"

export function deserializePrompt(row: {
  id: string
  title: string
  description: string
  content: string
  status: string
  source: string
  model: string
  category: string
  tags: string
  isFavorite: boolean
  notes: string
  variables: string
  agentAnalysis: string | null
  lastAnalyzedAt: Date | null
  agentVersion: string | null
  needsReanalysis: boolean
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...row,
    status: row.status as PromptStatus,
    model: row.model as ModelType,
    tags: JSON.parse(row.tags) as string[],
    variables: JSON.parse(row.variables) as Variable[],
    agentAnalysis: row.agentAnalysis
      ? (JSON.parse(row.agentAnalysis) as AgentAnalysisResult)
      : null,
    lastAnalyzedAt: row.lastAnalyzedAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export type SerializedPrompt = ReturnType<typeof deserializePrompt>
