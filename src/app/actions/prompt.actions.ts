"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Variable, PromptStatus, ModelType } from "@/types/prompt"
import type { AgentAnalysisResult } from "@/types/agent"

// ─── Response type ───────────────────────────────────────────────
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Helpers ─────────────────────────────────────────────────────
function revalidateAll() {
  revalidatePath("/[locale]", "layout")
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
  try {
    const rows = await prisma.prompt.findMany({ orderBy: { updatedAt: "desc" } })
    return { success: true, data: rows.map(deserializePrompt) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getPromptById(id: string): Promise<ActionResult<SerializedPrompt>> {
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
  try {
    const row = await prisma.prompt.create({
      data: {
        title: data.title,
        content: data.content,
        description: data.description ?? "",
        status: data.status ?? "inbox",
        source: data.source ?? "",
        model: data.model ?? "universal",
        category: data.category ?? "general",
        tags: JSON.stringify(data.tags ?? []),
        notes: data.notes ?? "",
        variables: JSON.stringify(data.variables ?? []),
        isFavorite: data.isFavorite ?? false,
      },
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
  try {
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

    const row = await prisma.prompt.update({ where: { id }, data: updateData })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deletePrompt(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await prisma.prompt.delete({ where: { id } })
    revalidateAll()
    return { success: true, data: { id } }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function toggleFavorite(id: string): Promise<ActionResult<SerializedPrompt>> {
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
  try {
    const row = await prisma.prompt.update({ where: { id }, data: { status } })
    revalidateAll()
    return { success: true, data: deserializePrompt(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function clonePrompt(id: string): Promise<ActionResult<SerializedPrompt>> {
  try {
    const original = await prisma.prompt.findUnique({ where: { id } })
    if (!original) return { success: false, error: "Prompt not found" }
    const row = await prisma.prompt.create({
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
