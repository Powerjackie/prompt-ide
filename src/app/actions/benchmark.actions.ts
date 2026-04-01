"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { deserializePromptSnapshot } from "@/lib/prompt-version"
import { evaluatePromptBenchmark } from "@/agent/llm-agent"
import { revalidatePath } from "next/cache"
import type {
  BenchmarkComparison,
  BenchmarkRun,
  PromptEvolutionComparison,
  PromptEvolutionComparisonRequestStrategy,
} from "@/types/benchmark"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

function deserializeBenchmarkRun(row: {
  id: string
  promptId: string
  promptVersionId: string
  evaluator: string
  input: string
  summary: string
  overallScore: number
  clarityScore: number
  reusabilityScore: number
  controllabilityScore: number
  deploymentReadinessScore: number
  improvementSuggestions: string
  recommendedForProduction: boolean
  rawOutput: string
  createdAt: Date
  promptVersion: {
    versionNumber: number
    changeSummary: string
  }
}): BenchmarkRun {
  return {
    id: row.id,
    promptId: row.promptId,
    promptVersionId: row.promptVersionId,
    promptVersionNumber: row.promptVersion.versionNumber,
    promptVersionChangeSummary: row.promptVersion.changeSummary,
    evaluator: row.evaluator,
    input: row.input,
    summary: row.summary,
    overallScore: row.overallScore,
    clarityScore: row.clarityScore,
    reusabilityScore: row.reusabilityScore,
    controllabilityScore: row.controllabilityScore,
    deploymentReadinessScore: row.deploymentReadinessScore,
    improvementSuggestions: JSON.parse(row.improvementSuggestions) as string[],
    recommendedForProduction: row.recommendedForProduction,
    rawOutput: JSON.parse(row.rawOutput) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  }
}

async function findLatestBenchmarkRunForVersion(promptId: string, promptVersionId: string) {
  const existing = await prisma.benchmarkRun.findFirst({
    where: { promptId, promptVersionId },
    orderBy: { createdAt: "desc" },
    include: {
      promptVersion: {
        select: {
          versionNumber: true,
          changeSummary: true,
        },
      },
    },
  })

  return existing ? deserializeBenchmarkRun(existing) : null
}

async function ensureBenchmarkRunForVersion(
  promptId: string,
  promptVersionId: string
): Promise<BenchmarkRun> {
  const existing = await findLatestBenchmarkRunForVersion(promptId, promptVersionId)
  if (existing) {
    return existing
  }

  const version = await prisma.promptVersion.findUnique({
    where: { id: promptVersionId },
  })

  if (!version || version.promptId !== promptId) {
    throw new Error("Prompt version not found")
  }

  const snapshot = deserializePromptSnapshot(version)
  const evaluation = await evaluatePromptBenchmark(snapshot, promptId, version.versionNumber)

  const row = await prisma.benchmarkRun.create({
    data: {
      promptId,
      promptVersionId: version.id,
      evaluator: evaluation.evaluator,
      input: JSON.stringify({
        promptId,
        versionNumber: version.versionNumber,
        snapshot,
      }),
      summary: evaluation.summary,
      overallScore: evaluation.overallScore,
      clarityScore: evaluation.clarityScore,
      reusabilityScore: evaluation.reusabilityScore,
      controllabilityScore: evaluation.controllabilityScore,
      deploymentReadinessScore: evaluation.deploymentReadinessScore,
      improvementSuggestions: JSON.stringify(evaluation.improvementSuggestions),
      recommendedForProduction: evaluation.recommendedForProduction,
      rawOutput: JSON.stringify(evaluation.rawOutput),
    },
    include: {
      promptVersion: {
        select: {
          versionNumber: true,
          changeSummary: true,
        },
      },
    },
  })

  return deserializeBenchmarkRun(row)
}

function createComparisonSummary(
  strategy: PromptEvolutionComparison["strategy"],
  comparison: BenchmarkRun,
  candidate: BenchmarkRun,
  deltas: PromptEvolutionComparison["deltas"]
) {
  const target =
    strategy === "baseline"
      ? `baseline v${comparison.promptVersionNumber}`
      : `previous version v${comparison.promptVersionNumber}`
  const direction =
    deltas.overallScore > 0 ? "improved" : deltas.overallScore < 0 ? "dropped" : "held steady"
  const production = candidate.recommendedForProduction
    ? "MiniMax recommends production promotion."
    : "MiniMax still recommends more iteration before production."

  return `Compared with ${target}, the candidate ${direction} by ${Math.abs(
    deltas.overallScore
  )} overall points. ${production}`
}

async function resolveLatestPromptEvolutionVersionIds(
  promptId: string,
  strategy: PromptEvolutionComparisonRequestStrategy = "auto"
) {
  const versions = await prisma.promptVersion.findMany({
    where: { promptId },
    orderBy: [{ versionNumber: "desc" }],
    select: {
      id: true,
      isBaseline: true,
    },
  })

  const latestVersionId = versions[0]?.id ?? null
  const baselineVersionId = versions.find((version) => version.isBaseline)?.id ?? null
  const previousVersionId = versions[1]?.id ?? null

  return {
    latestVersionId,
    comparisonVersionId:
      strategy === "baseline"
        ? baselineVersionId
        : strategy === "previous_version"
          ? previousVersionId
          : baselineVersionId ?? previousVersionId,
  }
}

export async function getBenchmarkRunsByPromptId(
  promptId: string
): Promise<ActionResult<BenchmarkRun[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.benchmarkRun.findMany({
      where: { promptId },
      orderBy: { createdAt: "desc" },
      include: {
        promptVersion: {
          select: {
            versionNumber: true,
            changeSummary: true,
          },
        },
      },
    })

    return { success: true, data: rows.map(deserializeBenchmarkRun) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function runPromptBenchmark(
  promptId: string,
  promptVersionId?: string
): Promise<ActionResult<BenchmarkRun>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const version = promptVersionId
      ? await prisma.promptVersion.findUnique({
          where: { id: promptVersionId },
        })
      : await prisma.promptVersion.findFirst({
          where: { promptId },
          orderBy: { versionNumber: "desc" },
        })

    if (!version || version.promptId !== promptId) {
      return { success: false, error: "Prompt version not found" }
    }

    const row = await ensureBenchmarkRunForVersion(promptId, version.id)
    revalidateAll()
    return { success: true, data: row }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function compareBenchmarkRuns(
  leftId: string,
  rightId: string
): Promise<ActionResult<BenchmarkComparison>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.benchmarkRun.findMany({
      where: { id: { in: [leftId, rightId] } },
      include: {
        promptVersion: {
          select: {
            versionNumber: true,
            changeSummary: true,
          },
        },
      },
    })

    const leftRow = rows.find((row) => row.id === leftId)
    const rightRow = rows.find((row) => row.id === rightId)

    if (!leftRow || !rightRow) {
      return { success: false, error: "Benchmark run not found" }
    }

    const left = deserializeBenchmarkRun(leftRow)
    const right = deserializeBenchmarkRun(rightRow)

    return {
      success: true,
      data: {
        left,
        right,
        deltas: {
          overallScore: right.overallScore - left.overallScore,
          clarityScore: right.clarityScore - left.clarityScore,
          reusabilityScore: right.reusabilityScore - left.reusabilityScore,
          controllabilityScore: right.controllabilityScore - left.controllabilityScore,
          deploymentReadinessScore:
            right.deploymentReadinessScore - left.deploymentReadinessScore,
        },
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function runPromptEvolutionComparison(
  promptId: string,
  candidateVersionId: string,
  comparisonVersionId: string
): Promise<ActionResult<PromptEvolutionComparison>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const [candidateVersion, comparisonVersion] = await Promise.all([
      prisma.promptVersion.findUnique({
        where: { id: candidateVersionId },
        select: { id: true, promptId: true, isBaseline: true, versionNumber: true },
      }),
      prisma.promptVersion.findUnique({
        where: { id: comparisonVersionId },
        select: { id: true, promptId: true, isBaseline: true, versionNumber: true },
      }),
    ])

    if (
      !candidateVersion ||
      !comparisonVersion ||
      candidateVersion.promptId !== promptId ||
      comparisonVersion.promptId !== promptId
    ) {
      return { success: false, error: "Prompt version not found" }
    }

    const [candidateRun, comparisonRun] = await Promise.all([
      ensureBenchmarkRunForVersion(promptId, candidateVersionId),
      ensureBenchmarkRunForVersion(promptId, comparisonVersionId),
    ])

    const deltas = {
      overallScore: candidateRun.overallScore - comparisonRun.overallScore,
      clarityScore: candidateRun.clarityScore - comparisonRun.clarityScore,
      reusabilityScore: candidateRun.reusabilityScore - comparisonRun.reusabilityScore,
      controllabilityScore:
        candidateRun.controllabilityScore - comparisonRun.controllabilityScore,
      deploymentReadinessScore:
        candidateRun.deploymentReadinessScore - comparisonRun.deploymentReadinessScore,
    }

    return {
      success: true,
      data: {
        strategy: comparisonVersion.isBaseline ? "baseline" : "previous_version",
        comparison: comparisonRun,
        candidate: candidateRun,
        deltas,
        recommendedForProduction: candidateRun.recommendedForProduction,
        summary: createComparisonSummary(
          comparisonVersion.isBaseline ? "baseline" : "previous_version",
          comparisonRun,
          candidateRun,
          deltas
        ),
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getLatestPromptEvolutionComparison(
  promptId: string,
  strategy: PromptEvolutionComparisonRequestStrategy = "auto"
): Promise<ActionResult<PromptEvolutionComparison | null>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const versions = await resolveLatestPromptEvolutionVersionIds(promptId, strategy)

    if (!versions.latestVersionId || !versions.comparisonVersionId) {
      return { success: true, data: null }
    }

    const [candidateVersion, comparisonVersion, candidateRun, comparisonRun] = await Promise.all([
      prisma.promptVersion.findUnique({
        where: { id: versions.latestVersionId },
        select: { id: true, promptId: true, isBaseline: true },
      }),
      prisma.promptVersion.findUnique({
        where: { id: versions.comparisonVersionId },
        select: { id: true, promptId: true, isBaseline: true },
      }),
      findLatestBenchmarkRunForVersion(promptId, versions.latestVersionId),
      findLatestBenchmarkRunForVersion(promptId, versions.comparisonVersionId),
    ])

    if (
      !candidateVersion ||
      !comparisonVersion ||
      candidateVersion.promptId !== promptId ||
      comparisonVersion.promptId !== promptId ||
      !candidateRun ||
      !comparisonRun
    ) {
      return { success: true, data: null }
    }

    const resolvedStrategy: PromptEvolutionComparison["strategy"] =
      strategy === "baseline"
        ? "baseline"
        : strategy === "previous_version"
          ? "previous_version"
          : comparisonVersion.isBaseline
            ? "baseline"
            : "previous_version"

    const deltas = {
      overallScore: candidateRun.overallScore - comparisonRun.overallScore,
      clarityScore: candidateRun.clarityScore - comparisonRun.clarityScore,
      reusabilityScore: candidateRun.reusabilityScore - comparisonRun.reusabilityScore,
      controllabilityScore:
        candidateRun.controllabilityScore - comparisonRun.controllabilityScore,
      deploymentReadinessScore:
        candidateRun.deploymentReadinessScore - comparisonRun.deploymentReadinessScore,
    }

    return {
      success: true,
      data: {
        strategy: resolvedStrategy,
        comparison: comparisonRun,
        candidate: candidateRun,
        deltas,
        recommendedForProduction: candidateRun.recommendedForProduction,
        summary: createComparisonSummary(
          resolvedStrategy,
          comparisonRun,
          candidateRun,
          deltas
        ),
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
