"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { deserializePromptSnapshot, serializePromptSnapshot } from "@/lib/prompt-version"
import { revalidatePath } from "next/cache"
import type { PromptVersion } from "@/types/prompt-version"
import type { SerializedPrompt } from "./prompt.actions"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

function deserializePromptVersion(row: {
  id: string
  promptId: string
  versionNumber: number
  changeSummary: string
  title: string
  description: string
  content: string
  status: string
  source: string
  model: string
  category: string
  tags: string
  notes: string
  variables: string
  createdAt: Date
}): PromptVersion {
  return {
    id: row.id,
    promptId: row.promptId,
    versionNumber: row.versionNumber,
    changeSummary: row.changeSummary,
    createdAt: row.createdAt.toISOString(),
    ...deserializePromptSnapshot(row),
  }
}

function deserializePrompt(row: {
  id: string
  title: string
  description: string
  content: string
  status: string
  source: string
  model: string
  category: string
  tags: string
  isFavorite: boolean
  notes: string
  variables: string
  agentAnalysis: string | null
  lastAnalyzedAt: Date | null
  agentVersion: string | null
  needsReanalysis: boolean
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): SerializedPrompt {
  return {
    ...row,
    status: row.status as SerializedPrompt["status"],
    model: row.model as SerializedPrompt["model"],
    tags: JSON.parse(row.tags) as string[],
    variables: JSON.parse(row.variables) as SerializedPrompt["variables"],
    agentAnalysis: row.agentAnalysis
      ? (JSON.parse(row.agentAnalysis) as SerializedPrompt["agentAnalysis"])
      : null,
    lastAnalyzedAt: row.lastAnalyzedAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getPromptVersionsByPromptId(
  promptId: string
): Promise<ActionResult<PromptVersion[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.promptVersion.findMany({
      where: { promptId },
      orderBy: { versionNumber: "desc" },
    })
    return { success: true, data: rows.map(deserializePromptVersion) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function restorePromptVersion(
  promptId: string,
  versionId: string
): Promise<
  ActionResult<{
    prompt: SerializedPrompt
    restoredVersion: PromptVersion
  }>
> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const version = await tx.promptVersion.findUnique({
        where: { id: versionId },
      })

      if (!version || version.promptId !== promptId) {
        throw new Error("Prompt version not found")
      }

      const latestVersion = await tx.promptVersion.findFirst({
        where: { promptId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      })

      const updatedPrompt = await tx.prompt.update({
        where: { id: promptId },
        data: {
          ...serializePromptSnapshot(deserializePromptSnapshot(version)),
          agentAnalysis: null,
          lastAnalyzedAt: null,
          agentVersion: null,
          needsReanalysis: true,
        },
      })

      await tx.promptVersion.create({
        data: {
          promptId,
          versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
          changeSummary: `Restored from v${version.versionNumber}`,
          ...serializePromptSnapshot(deserializePromptSnapshot(version)),
        },
      })

      return {
        prompt: deserializePrompt(updatedPrompt),
        restoredVersion: deserializePromptVersion(version),
      }
    })

    revalidateAll()
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
