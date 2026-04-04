"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { formatActionError } from "@/lib/error-utils"
import { prisma } from "@/lib/prisma"
import { analyzePromptWithAgent, refactorPromptWithAgent } from "@/agent/llm-agent"
import type { AgentTrajectoryStep } from "@/types/agent"
import { isPromptRefactorRunOutput, type PromptRefactorResult } from "@/types/refactor"
import { updatePrompt, type SerializedPrompt } from "@/app/actions/prompt.actions"
import { revalidatePath } from "next/cache"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function formatAgentError(error: unknown, locale: "zh" | "en" | undefined) {
  return formatActionError(error, locale ?? "en")
}

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

async function resolvePromptEvolutionVersions(promptId: string) {
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
    comparisonVersionId: baselineVersionId ?? previousVersionId,
  }
}

export async function runAgentAnalysis(
  promptContent: string,
  promptId: string,
  locale?: "zh" | "en"
): Promise<
  ActionResult<{
    analysis: Awaited<ReturnType<typeof analyzePromptWithAgent>>["analysis"]
    trajectory: AgentTrajectoryStep[]
    historyId: string
  }>
> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const result = await analyzePromptWithAgent(promptContent, promptId, locale)

    const history = await prisma.agentHistory.create({
      data: {
        promptId,
        type: "react_trajectory",
        input: promptContent,
        output: JSON.stringify(result.output),
        trajectory: JSON.stringify(result.trajectory),
      },
    })

    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        agentAnalysis: JSON.stringify(result.analysis),
        lastAnalyzedAt: new Date(result.analysis.analyzedAt),
        agentVersion: result.analysis.analysisVersion,
        needsReanalysis: false,
      },
    })

    revalidateAll()

    return {
      success: true,
      data: {
        analysis: result.analysis,
        trajectory: result.trajectory,
        historyId: history.id,
      },
    }
  } catch (error) {
    return { success: false, error: formatAgentError(error, locale) }
  }
}

export async function runStatelessAgentAnalysis(
  content: string,
  locale?: "zh" | "en"
): Promise<
  ActionResult<{
    analysis: Awaited<ReturnType<typeof analyzePromptWithAgent>>["analysis"]
    trajectory: AgentTrajectoryStep[]
  }>
> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const result = await analyzePromptWithAgent(content, "playground-ephemeral", locale)

    return {
      success: true,
      data: {
        analysis: result.analysis,
        trajectory: result.trajectory,
      },
    }
  } catch (error) {
    return { success: false, error: formatAgentError(error, locale) }
  }
}

async function loadStoredRefactorProposal(
  promptId: string,
  historyId: string
): Promise<
  | { proposal: PromptRefactorResult }
  | { error: string }
> {
  const history = await prisma.agentHistory.findUnique({ where: { id: historyId } })

  if (!history || history.promptId !== promptId || history.type !== "refactor_proposal") {
    return { error: "Refactor proposal not found" }
  }

  const parsedOutput = JSON.parse(history.output) as unknown
  if (!isPromptRefactorRunOutput(parsedOutput)) {
    return { error: "Stored refactor proposal is invalid" }
  }

  return {
    proposal: parsedOutput.result,
  }
}

export async function runPromptRefactor(
  promptContent: string,
  promptId: string,
  locale?: "zh" | "en"
): Promise<
  ActionResult<{
    proposal: PromptRefactorResult
    trajectory: AgentTrajectoryStep[]
    historyId: string
  }>
> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const result = await refactorPromptWithAgent(promptContent, promptId, locale)

    const history = await prisma.agentHistory.create({
      data: {
        promptId,
        type: "refactor_proposal",
        input: promptContent,
        output: JSON.stringify(result.output),
        trajectory: JSON.stringify(result.trajectory),
      },
    })

    revalidateAll()

    return {
      success: true,
      data: {
        proposal: result.proposal,
        trajectory: result.trajectory,
        historyId: history.id,
      },
    }
  } catch (error) {
    return { success: false, error: formatAgentError(error, locale) }
  }
}

export async function applyRefactorDraft(
  promptId: string,
  historyId: string
): Promise<
  ActionResult<{
    prompt: SerializedPrompt
    latestVersionId: string | null
    comparisonVersionId: string | null
  }>
> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const stored = await loadStoredRefactorProposal(promptId, historyId)
    if ("error" in stored) {
      return { success: false, error: stored.error }
    }

    const result = await updatePrompt(promptId, {
      title: stored.proposal.cleanedPromptDraft.title,
      description: stored.proposal.cleanedPromptDraft.description,
      content: stored.proposal.cleanedPromptDraft.content,
      tags: stored.proposal.cleanedPromptDraft.tags,
    })

    if (!result.success) {
      return result
    }

    const versions = await resolvePromptEvolutionVersions(promptId)

    return {
      success: true,
      data: {
        prompt: result.data,
        ...versions,
      },
    }
  } catch (error) {
    return { success: false, error: formatActionError(error) }
  }
}

export async function applyRefactorVariables(
  promptId: string,
  historyId: string
): Promise<
  ActionResult<{
    prompt: SerializedPrompt
    latestVersionId: string | null
    comparisonVersionId: string | null
  }>
> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const stored = await loadStoredRefactorProposal(promptId, historyId)
    if ("error" in stored) {
      return { success: false, error: stored.error }
    }

    const result = await updatePrompt(promptId, {
      variables: stored.proposal.suggestedVariables,
    })

    if (!result.success) {
      return result
    }

    const versions = await resolvePromptEvolutionVersions(promptId)

    return {
      success: true,
      data: {
        prompt: result.data,
        ...versions,
      },
    }
  } catch (error) {
    return { success: false, error: formatActionError(error) }
  }
}

export async function createModulesFromRefactor(
  promptId: string,
  historyId: string,
  moduleIndexes: number[]
): Promise<ActionResult<{ createdCount: number; modules: { id: string; title: string }[] }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const stored = await loadStoredRefactorProposal(promptId, historyId)
    if ("error" in stored) {
      return { success: false, error: stored.error }
    }

    const uniqueIndexes = Array.from(
      new Set(moduleIndexes.filter((index) => Number.isInteger(index) && index >= 0))
    )
    if (uniqueIndexes.length === 0) {
      return { success: false, error: "Select at least one module suggestion" }
    }

    const selectedModules = uniqueIndexes
      .map((index) => stored.proposal.extractedModules[index] ?? null)
      .filter((module): module is PromptRefactorResult["extractedModules"][number] => module !== null)

    if (selectedModules.length === 0) {
      return { success: false, error: "No valid module suggestions were selected" }
    }

    const created = await prisma.$transaction(
      selectedModules.map((module) =>
        prisma.module.create({
          data: {
            title: module.title,
            type: module.type,
            content: module.content,
            tags: JSON.stringify(module.tags),
          },
          select: { id: true, title: true },
        })
      )
    )

    revalidateAll()

    return {
      success: true,
      data: {
        createdCount: created.length,
        modules: created,
      },
    }
  } catch (error) {
    return { success: false, error: formatActionError(error) }
  }
}
