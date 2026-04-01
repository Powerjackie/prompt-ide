import type { BenchmarkRun } from "@/types/benchmark"
import type { PromptVersion } from "@/types/prompt-version"
import type { SkillHealthState, SkillHealthSummary, SkillRunRecord } from "@/types/skill"

export type SkillAttentionKey =
  | "needsBaseline"
  | "needsBenchmark"
  | "needsValidation"
  | "needsIteration"
  | "stable"

interface DeriveSkillHealthInput {
  latestBenchmark: BenchmarkRun | null
  baselineVersion: PromptVersion | null
  recentRun: SkillRunRecord | null
}

export function deriveSkillHealth({
  latestBenchmark,
  baselineVersion,
  recentRun,
}: DeriveSkillHealthInput): SkillHealthSummary {
  const state: SkillHealthState =
    latestBenchmark?.recommendedForProduction &&
    baselineVersion &&
    recentRun &&
    recentRun.riskLevel !== "high"
      ? "ready"
      : latestBenchmark || baselineVersion || recentRun
        ? "watch"
        : "setup"

  return {
    state,
    hasBaseline: Boolean(baselineVersion),
    hasBenchmark: Boolean(latestBenchmark),
    hasRecentRun: Boolean(recentRun),
    baselineVersionNumber: baselineVersion?.versionNumber ?? null,
    benchmarkScore: latestBenchmark?.overallScore ?? null,
    recommendedForProduction: latestBenchmark?.recommendedForProduction ?? false,
    recentRunRiskLevel: recentRun?.riskLevel ?? null,
    recentRunConfidence: recentRun?.confidence ?? null,
    recentRunCreatedAt: recentRun?.createdAt ?? null,
  }
}

export function getSkillHealthVariant(state: SkillHealthState): "default" | "secondary" | "outline" {
  if (state === "ready") {
    return "default"
  }

  if (state === "watch") {
    return "secondary"
  }

  return "outline"
}

export function getSkillAttentionKey(health: SkillHealthSummary): SkillAttentionKey {
  if (!health.hasBaseline) {
    return "needsBaseline"
  }

  if (!health.hasBenchmark) {
    return "needsBenchmark"
  }

  if (!health.hasRecentRun) {
    return "needsValidation"
  }

  if (!health.recommendedForProduction) {
    return "needsIteration"
  }

  return "stable"
}

export function getSkillAttentionRank(health: SkillHealthSummary): number {
  const key = getSkillAttentionKey(health)

  if (key === "needsBaseline") return 0
  if (key === "needsBenchmark") return 1
  if (key === "needsValidation") return 2
  if (key === "needsIteration") return 3
  return 4
}
