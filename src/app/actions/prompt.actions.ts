"use server"

import { AUTH_ERRORS, ensureAdmin, ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { buildChangeSummary, deserializePromptSnapshot, serializePromptSnapshot } from "@/lib/prompt-version"
import { revalidatePath } from "next/cache"
import { getDefaultSettings, getEffectiveSettings } from "@/lib/settings/effective-settings"
import type { Variable, PromptStatus, ModelType } from "@/types/prompt"
import type { AgentAnalysisResult } from "@/types/agent"
import type { PromptVersionSnapshot } from "@/types/prompt-version"

// ─── Response type ───────────────────────────────────────────────
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Helpers ─────────────────────────────────────────────────────
function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

const SKILL_RUN_STATE_KEY = "skill-run-state"

async function removeSkillRunStateEntries(skillIds: string[]) {
  if (skillIds.length === 0) {
    return
  }

  const row = await prisma.setting.findUnique({ where: { key: SKILL_RUN_STATE_KEY } })
  if (!row) {
    return
  }

  try {
    const parsed = JSON.parse(row.value) as {
      recentValuesBySkillId?: Record<string, unknown>
      presetsBySkillId?: Record<string, unknown>
      recentRunsBySkillId?: Record<string, unknown>
    }

    for (const skillId of skillIds) {
      delete parsed.recentValuesBySkillId?.[skillId]
      delete parsed.presetsBySkillId?.[skillId]
      delete parsed.recentRunsBySkillId?.[skillId]
    }

    await prisma.setting.update({
      where: { key: SKILL_RUN_STATE_KEY },
      data: { value: JSON.stringify(parsed) },
    })
  } catch {
    // Ignore malformed auxiliary state instead of blocking prompt deletion.
  }
}

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

/** Convert DB row (JSON strings) → typed Prompt object */
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
}) {
  return {
    ...row,
    status: row.status as PromptStatus,
    model: row.model as ModelType,
    tags: JSON.parse(row.tags) as string[],
    variables: JSON.parse(row.variables) as Variable[],
    agentAnalysis: row.agentAnalysis
      ? (JSON.parse(row.agentAnalysis) as AgentAnalysisResult)
      : null,
    lastAnalyzedAt: row.lastAnalyzedAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export type SerializedPrompt = ReturnType<typeof deserializePrompt>

// ─── Queries ─────────────────────────────────────────────────────
export async function getPrompts(): Promise<ActionResult<SerializedPrompt[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.prompt.findMany({ orderBy: { updatedAt: "desc" } })
    return { success: true, data: rows.map(deserializePrompt) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getPromptById(id: string): Promise<ActionResult<SerializedPrompt>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.prompt.findUnique({ where: { id } })
    if (!row) return { success: false, error: "Prompt not found" }
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────
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
    if (data.agentAnalysis !== undefined)
      updateData.agentAnalysis = data.agentAnalysis ? JSON.stringify(data.agentAnalysis) : null
    if (data.lastAnalyzedAt !== undefined)
      updateData.lastAnalyzedAt = data.lastAnalyzedAt ? new Date(data.lastAnalyzedAt) : null
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
          buildChangeSummary(changedSnapshotFields.map((field) => field.replace(/([A-Z])/g, " $1").toLowerCase()))
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

export async function deletePrompt(id: string): Promise<ActionResult<{ id: string }>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const linkedSkills = await prisma.skill.findMany({
      where: { entryPromptId: id },
      select: { id: true },
    })

    await prisma.prompt.delete({ where: { id } })
    await removeSkillRunStateEntries(linkedSkills.map((skill) => skill.id))
    revalidateAll()
    return { success: true, data: { id } }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function toggleFavorite(id: string): Promise<ActionResult<SerializedPrompt>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await prisma.prompt.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Prompt not found" }
    const row = await prisma.prompt.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
    })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function setPromptStatus(
  id: string,
  status: string
): Promise<ActionResult<SerializedPrompt>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.prompt.update({ where: { id }, data: { status } })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function clonePrompt(id: string): Promise<ActionResult<SerializedPrompt>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const original = await prisma.prompt.findUnique({ where: { id } })
    if (!original) return { success: false, error: "Prompt not found" }
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.prompt.create({
        data: {
          title: `${original.title} (Clone)`,
          description: original.description,
          content: original.content,
          status: "inbox",
          source: original.source,
          model: original.model,
          category: original.category,
          tags: original.tags,
          notes: original.notes,
          variables: original.variables,
          isFavorite: false,
          needsReanalysis: true,
        },
      })

      await createPromptVersionSnapshot(
        tx,
        created.id,
        {
          title: created.title,
          description: created.description,
          content: created.content,
          status: created.status as PromptStatus,
          source: created.source,
          model: created.model as ModelType,
          category: created.category,
          tags: JSON.parse(created.tags) as string[],
          notes: created.notes,
          variables: JSON.parse(created.variables) as Variable[],
        },
        "Cloned from existing prompt",
        1
      )

      return created
    })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function setPromptAnalysis(
  id: string,
  analysis: AgentAnalysisResult
): Promise<ActionResult<SerializedPrompt>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.prompt.update({
      where: { id },
      data: {
        agentAnalysis: JSON.stringify(analysis),
        lastAnalyzedAt: new Date(),
        agentVersion: analysis.analysisVersion,
        needsReanalysis: false,
      },
    })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function markPromptLastUsed(id: string): Promise<ActionResult<SerializedPrompt>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.prompt.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
