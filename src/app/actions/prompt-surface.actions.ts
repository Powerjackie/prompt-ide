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
