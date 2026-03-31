"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ─── Response type ───────────────────────────────────────────────
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Helpers ─────────────────────────────────────────────────────
function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

function deserializeModule(row: {
  id: string
  title: string
  type: string
  content: string
  tags: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...row,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export type SerializedModule = ReturnType<typeof deserializeModule>

// ─── Queries ─────────────────────────────────────────────────────
export async function getModules(): Promise<ActionResult<SerializedModule[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.module.findMany({ orderBy: { updatedAt: "desc" } })
    return { success: true, data: rows.map(deserializeModule) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getModuleById(id: string): Promise<ActionResult<SerializedModule>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.module.findUnique({ where: { id } })
    if (!row) return { success: false, error: "Module not found" }
    return { success: true, data: deserializeModule(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getModulesByType(type: string): Promise<ActionResult<SerializedModule[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.module.findMany({
      where: { type },
      orderBy: { updatedAt: "desc" },
    })
    return { success: true, data: rows.map(deserializeModule) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────
export async function createModule(data: {
  title: string
  type: string
  content: string
  tags?: string[]
}): Promise<ActionResult<SerializedModule>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.module.create({
      data: {
        title: data.title,
        type: data.type,
        content: data.content,
        tags: JSON.stringify(data.tags ?? []),
      },
    })
    revalidateAll()
    return { success: true, data: deserializeModule(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateModule(
  id: string,
  data: {
    title?: string
    type?: string
    content?: string
    tags?: string[]
  }
): Promise<ActionResult<SerializedModule>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.type !== undefined) updateData.type = data.type
    if (data.content !== undefined) updateData.content = data.content
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)

    const row = await prisma.module.update({ where: { id }, data: updateData })
    revalidateAll()
    return { success: true, data: deserializeModule(row) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteModule(id: string): Promise<ActionResult<{ id: string }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.module.delete({ where: { id } })
    revalidateAll()
    return { success: true, data: { id } }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
