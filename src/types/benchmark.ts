export type PromptEvolutionComparisonStrategy = "baseline" | "previous_version"
export type PromptEvolutionComparisonRequestStrategy =
  | "auto"
  | PromptEvolutionComparisonStrategy

export interface BenchmarkScores {
  overallScore: number
  clarityScore: number
  reusabilityScore: number
  controllabilityScore: number
  deploymentReadinessScore: number
}

export interface BenchmarkResult extends BenchmarkScores {
  summary: string
  improvementSuggestions: string[]
  recommendedForProduction: boolean
  evaluator: string
  rawOutput: Record<string, unknown>
}

export interface BenchmarkRun extends BenchmarkScores {
  id: string
  promptId: string
  promptVersionId: string
  promptVersionNumber: number
  promptVersionChangeSummary: string
  evaluator: string
  input: string
  summary: string
  improvementSuggestions: string[]
  recommendedForProduction: boolean
  rawOutput: Record<string, unknown>
  createdAt: string
}

export interface BenchmarkComparison {
  left: BenchmarkRun
  right: BenchmarkRun
  deltas: BenchmarkScores
}

export interface PromptEvolutionComparison {
  strategy: PromptEvolutionComparisonStrategy
  candidate: BenchmarkRun
  comparison: BenchmarkRun
  summary: string
  recommendedForProduction: boolean
  deltas: BenchmarkScores
}
