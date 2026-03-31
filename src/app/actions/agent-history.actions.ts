"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import type { AgentRunOutput, AgentTrajectoryStep } from "@/types/agent"
import { revalidatePath } from "next/cache"

// ─── Response type ───────────────────────────────────────────────
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

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
    output: JSON.parse(row.output) as AgentRunOutput | Record<string, unknown>,
    trajectory: JSON.parse(row.trajectory) as AgentTrajectoryStep[],
    createdAt: row.createdAt.toISOString(),
  }
}

export type SerializedAgentHistory = ReturnType<typeof deserializeHistory>

// ─── Queries ─────────────────────────────────────────────────────
export async function getHistoryByPromptId(
  promptId: string
): Promise<ActionResult<SerializedAgentHistory[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.agentHistory.findMany({
      where: { promptId },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: rows.map(deserializeHistory) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────
export async function createAgentHistory(data: {
  promptId: string
  type?: string
  input: string
  output: Record<string, unknown>
  trajectory?: unknown[]
}): Promise<ActionResult<SerializedAgentHistory>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.agentHistory.create({
      data: {
        promptId: data.promptId,
        type: data.type ?? "rule_analysis",
        input: data.input,
        output: JSON.stringify(data.output),
        trajectory: JSON.stringify(data.trajectory ?? []),
      },
    })
    revalidateAll()
    return { success: true, data: deserializeHistory(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteAgentHistory(id: string): Promise<ActionResult<{ id: string }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.agentHistory.delete({ where: { id } })
    revalidateAll()
    return { success: true, data: { id } }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
