"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { analyzePromptWithAgent } from "@/agent/llm-agent"
import type { AgentTrajectoryStep } from "@/types/agent"
import { revalidatePath } from "next/cache"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

export async function runAgentAnalysis(
  promptContent: string,
  promptId: string
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
    const result = await analyzePromptWithAgent(promptContent, promptId)

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
    return { success: false, error: (error as Error).message }
  }
}

export async function runStatelessAgentAnalysis(
  content: string
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
    const result = await analyzePromptWithAgent(content, "playground-ephemeral")

    return {
      success: true,
      data: {
        analysis: result.analysis,
        trajectory: result.trajectory,
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
