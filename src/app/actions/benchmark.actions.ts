"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { deserializePromptSnapshot } from "@/lib/prompt-version"
import { evaluatePromptBenchmark } from "@/agent/llm-agent"
import { revalidatePath } from "next/cache"
import type { BenchmarkComparison, BenchmarkRun } from "@/types/benchmark"

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

    revalidateAll()
    return { success: true, data: deserializeBenchmarkRun(row) }
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
