"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import type { AgentHistoryType, AgentRunOutput, AgentTrajectoryStep } from "@/types/agent"
import type { PromptRefactorRunOutput } from "@/types/refactor"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function deserializeHistory(row: {
  id: string
  promptId: string
  type: string
  input: string
  output: string
  trajectory: string
  createdAt: Date
}) {
  return {
    ...row,
    output: JSON.parse(row.output) as
      | AgentRunOutput
      | PromptRefactorRunOutput
      | Record<string, unknown>,
    trajectory: JSON.parse(row.trajectory) as AgentTrajectoryStep[],
    createdAt: row.createdAt.toISOString(),
  }
}

export type SerializedAgentHistory = ReturnType<typeof deserializeHistory>

export async function getHistoryByPromptId(
  promptId: string,
  type?: AgentHistoryType
): Promise<ActionResult<SerializedAgentHistory[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.agentHistory.findMany({
      where: {
        promptId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: rows.map(deserializeHistory) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
