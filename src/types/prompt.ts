export interface Variable {
  name: string
  description: string
  defaultValue: string
}

export type PromptStatus = "inbox" | "production" | "archived"

export type ModelType = "universal" | "claude" | "gpt4" | "gemini" | "deepseek"

export interface Prompt {
  id: string
  title: string
  description: string
  content: string
  status: PromptStatus
  source: string
  model: ModelType
  category: string
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  lastUsedAt: string | null
  notes: string
  variables: Variable[]
  // Agent fields
  agentAnalysis: import("./agent").AgentAnalysisResult | null
  lastAnalyzedAt: string | null
  agentVersion: string | null
  needsReanalysis: boolean
}
