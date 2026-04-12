"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { deserializePrompt, type SerializedPrompt } from "./prompt-shared"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

export type { SerializedPrompt } from "./prompt-shared"

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

export interface PromptFilterParams {
  search?: string
  status?: string
  model?: string
  tag?: string
}

function buildWhereClause(filters?: PromptFilterParams) {
  const where: Record<string, unknown> = {}
  const andClauses: Record<string, unknown>[] = []

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status
  }
  if (filters?.model && filters.model !== "all") {
    where.model = filters.model
  }
  if (filters?.tag && filters.tag !== "all") {
    andClauses.push({ tags: { contains: `"${filters.tag}"` } })
  }
  if (filters?.search) {
    const q = filters.search
    andClauses.push({
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { content: { contains: q } },
        { tags: { contains: q } },
      ],
    })
  }
  if (andClauses.length) where.AND = andClauses
  return where
}

export async function getPromptsPaginated(
  page: number = 1,
  pageSize: number = 24,
  filters?: PromptFilterParams
): Promise<ActionResult<{ prompts: SerializedPrompt[]; total: number; page: number; pageSize: number }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const where = buildWhereClause(filters)
    const skip = (page - 1) * pageSize
    const [rows, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.prompt.count({ where }),
    ])
    return {
      success: true,
      data: { prompts: rows.map(deserializePrompt), total, page, pageSize },
    }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getPromptsCount(): Promise<ActionResult<number>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    return { success: true, data: await prisma.prompt.count() }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getRecentPrompts(limit: number = 4): Promise<ActionResult<SerializedPrompt[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.prompt.findMany({
      where: { status: { notIn: ["inbox", "archived"] } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    })
    return { success: true, data: rows.map(deserializePrompt) }
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

export async function getAllTags(): Promise<ActionResult<string[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.prompt.findMany({ select: { tags: true } })
    const tagSet = new Set<string>()
    for (const row of rows) {
      const parsed = JSON.parse(row.tags) as string[]
      for (const t of parsed) tagSet.add(t)
    }
    return { success: true, data: Array.from(tagSet).sort() }
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
