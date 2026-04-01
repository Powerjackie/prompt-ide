import type { ModuleType } from "./module"
import type { Variable } from "./prompt"

export interface CleanedPromptDraft {
  title: string
  description: string
  content: string
  tags: string[]
}

export interface RefactorModuleSuggestion {
  title: string
  type: ModuleType
  content: string
  tags: string[]
  rationale: string
}

export interface PromptRefactorResult {
  summary: string
  cleanedPromptDraft: CleanedPromptDraft
  suggestedVariables: Variable[]
  extractedModules: RefactorModuleSuggestion[]
  analysisVersion: string
  generatedAt: string
}

export interface PromptRefactorRunOutput {
  result: PromptRefactorResult
  meta: {
    engine: string
    provider: string
    transport: string
    runType: "refactor_proposal"
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isPromptRefactorResult(value: unknown): value is PromptRefactorResult {
  if (!isRecord(value)) return false

  return (
    typeof value.summary === "string" &&
    isRecord(value.cleanedPromptDraft) &&
    typeof value.cleanedPromptDraft.title === "string" &&
    typeof value.cleanedPromptDraft.description === "string" &&
    typeof value.cleanedPromptDraft.content === "string" &&
    Array.isArray(value.cleanedPromptDraft.tags) &&
    Array.isArray(value.suggestedVariables) &&
    Array.isArray(value.extractedModules) &&
    typeof value.analysisVersion === "string" &&
    typeof value.generatedAt === "string"
  )
}

export function isPromptRefactorRunOutput(value: unknown): value is PromptRefactorRunOutput {
  if (!isRecord(value) || !isRecord(value.meta)) return false

  return value.meta.runType === "refactor_proposal" && isPromptRefactorResult(value.result)
}
