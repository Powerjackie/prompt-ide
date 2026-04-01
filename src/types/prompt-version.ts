import type { ModelType, PromptStatus, Variable } from "./prompt"

export interface PromptVersionSnapshot {
  title: string
  description: string
  content: string
  status: PromptStatus
  source: string
  model: ModelType
  category: string
  tags: string[]
  notes: string
  variables: Variable[]
}

export interface PromptVersion extends PromptVersionSnapshot {
  id: string
  promptId: string
  versionNumber: number
  isBaseline: boolean
  changeSummary: string
  createdAt: string
}
