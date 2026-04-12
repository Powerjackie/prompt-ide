"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { buildChangeSummary, deserializePromptSnapshot, serializePromptSnapshot } from "@/lib/prompt-version"
import { getDefaultSettings, getEffectiveSettings } from "@/lib/settings/effective-settings"
import { revalidatePath } from "next/cache"
import type { AgentAnalysisResult } from "@/types/agent"
import type { Variable, PromptStatus, ModelType } from "@/types/prompt"
import type { PromptVersionSnapshot } from "@/types/prompt-version"
import { deserializePrompt, type SerializedPrompt } from "./prompt-shared"

export type { SerializedPrompt } from "./prompt-shared"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

const SNAPSHOT_FIELDS = [
  "title",
  "description",
  "content",
  "status",
  "source",
  "model",
  "category",
  "tags",
  "notes",
  "variables",
] as const

type PromptVersionWriter = {
  promptVersion: {
    findFirst: typeof prisma.promptVersion.findFirst
    create: typeof prisma.promptVersion.create
  }
}

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

function createSnapshotFromInput(data: {
  title: string
  description?: string
  content: string
  status?: string
  source?: string
  model?: string
  category?: string
  tags?: string[]
  notes?: string
  variables?: Variable[]
}): PromptVersionSnapshot {
  return {
    title: data.title,
    description: data.description ?? "",
    content: data.content,
    status: (data.status ?? "inbox") as PromptStatus,
    source: data.source ?? "",
    model: (data.model ?? "universal") as ModelType,
    category: data.category ?? "general",
    tags: data.tags ?? [],
    notes: data.notes ?? "",
    variables: data.variables ?? [],
  }
}

async function createPromptVersionSnapshot(
  tx: PromptVersionWriter,
  promptId: string,
  snapshot: PromptVersionSnapshot,
  changeSummary: string,
  versionNumber?: number
) {
  const latestVersion =
    versionNumber === undefined
      ? await tx.promptVersion.findFirst({
          where: { promptId },
          orderBy: { versionNumber: "desc" },
          select: { versionNumber: true },
        })
      : null

  const nextVersion = versionNumber ?? (latestVersion?.versionNumber ?? 0) + 1

  await tx.promptVersion.create({
    data: {
      promptId,
      versionNumber: nextVersion,
      changeSummary,
      ...serializePromptSnapshot(snapshot),
    },
  })
}

export async function createPrompt(data: {
  title: string
  content: string
  description?: string
  status?: string
  source?: string
  model?: string
  category?: string
  tags?: string[]
  notes?: string
  variables?: Variable[]
  isFavorite?: boolean
}): Promise<ActionResult<SerializedPrompt>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const settingsResult = await getEffectiveSettings()
    const settings = settingsResult.success ? settingsResult.data : getDefaultSettings()
    const resolvedData = {
      ...data,
      model: data.model ?? settings.defaultModel,
      status: data.status ?? settings.defaultStatus,
    }
    const snapshot = createSnapshotFromInput(resolvedData)
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.prompt.create({
        data: {
          ...serializePromptSnapshot(snapshot),
          isFavorite: data.isFavorite ?? false,
        },
      })

      await createPromptVersionSnapshot(tx, created.id, snapshot, "Initial version", 1)

      return created
    })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updatePrompt(
  id: string,
  data: {
    title?: string
    content?: string
    description?: string
    status?: string
    source?: string
    model?: string
    category?: string
    tags?: string[]
    notes?: string
    variables?: Variable[]
    isFavorite?: boolean
    agentAnalysis?: AgentAnalysisResult | null
    lastAnalyzedAt?: string | null
    agentVersion?: string | null
    needsReanalysis?: boolean
  }
): Promise<ActionResult<SerializedPrompt>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await prisma.prompt.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Prompt not found" }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.source !== undefined) updateData.source = data.source
    if (data.model !== undefined) updateData.model = data.model
    if (data.category !== undefined) updateData.category = data.category
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables)
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite
    if (data.agentAnalysis !== undefined) {
      updateData.agentAnalysis = data.agentAnalysis ? JSON.stringify(data.agentAnalysis) : null
    }
    if (data.lastAnalyzedAt !== undefined) {
      updateData.lastAnalyzedAt = data.lastAnalyzedAt ? new Date(data.lastAnalyzedAt) : null
    }
    if (data.agentVersion !== undefined) updateData.agentVersion = data.agentVersion
    if (data.needsReanalysis !== undefined) updateData.needsReanalysis = data.needsReanalysis

    const changedSnapshotFields = SNAPSHOT_FIELDS.filter((field) => data[field] !== undefined)
    if (changedSnapshotFields.length > 0 && data.agentAnalysis === undefined) {
      updateData.agentAnalysis = null
      updateData.lastAnalyzedAt = null
      updateData.agentVersion = null
      updateData.needsReanalysis = data.needsReanalysis ?? true
    }

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.prompt.update({ where: { id }, data: updateData })

      if (changedSnapshotFields.length > 0) {
        const snapshot = deserializePromptSnapshot(updated)
        await createPromptVersionSnapshot(
          tx,
          id,
          snapshot,
          buildChangeSummary(
            changedSnapshotFields.map((field) => field.replace(/([A-Z])/g, " $1").toLowerCase())
          )
        )
      }

      return updated
    })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
