"use server"

import { AUTH_ERRORS, ensureAdmin, ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Collection, CollectionItem, CollectionItemType, CollectionType } from "@/types/collection"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

function deserializeCollection(row: {
  id: string
  title: string
  description: string
  type: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    items: number
  }
}): Collection {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as CollectionType,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    itemCount: row._count?.items ?? 0,
  }
}

function deserializeCollectionItem(row: {
  id: string
  collectionId: string
  itemType: string
  promptId: string | null
  moduleId: string | null
  position: number
  createdAt: Date
  prompt?: {
    id: string
    title: string
    description: string
  } | null
  module?: {
    id: string
    title: string
    type: string
  } | null
}): CollectionItem {
  const item =
    row.prompt
      ? {
          id: row.prompt.id,
          title: row.prompt.title,
          description: row.prompt.description,
          href: `/prompts/${row.prompt.id}`,
        }
      : row.module
        ? {
            id: row.module.id,
            title: row.module.title,
            subtitle: row.module.type,
            href: "/modules",
          }
        : null

  return {
    id: row.id,
    collectionId: row.collectionId,
    itemType: row.itemType as CollectionItemType,
    promptId: row.promptId,
    moduleId: row.moduleId,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    item,
  }
}

export async function getCollections(): Promise<ActionResult<Collection[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.collection.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    return { success: true, data: rows.map(deserializeCollection) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getCollectionById(
  id: string
): Promise<ActionResult<{ collection: Collection; items: CollectionItem[] }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
        items: {
          orderBy: { position: "asc" },
          include: {
            prompt: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
            module: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
    })

    if (!row) {
      return { success: false, error: "Collection not found" }
    }

    return {
      success: true,
      data: {
        collection: deserializeCollection(row),
        items: row.items.map(deserializeCollectionItem),
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function createCollection(data: {
  title: string
  description?: string
  type?: CollectionType
}): Promise<ActionResult<Collection>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.collection.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        type: data.type ?? "workflow",
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    revalidateAll()
    return { success: true, data: deserializeCollection(row) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updateCollection(
  id: string,
  data: {
    title?: string
    description?: string
    type?: CollectionType
  }
): Promise<ActionResult<Collection>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.collection.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    revalidateAll()
    return { success: true, data: deserializeCollection(row) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteCollection(id: string): Promise<ActionResult<{ id: string }>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    await prisma.collection.delete({ where: { id } })
    revalidateAll()
    return { success: true, data: { id } }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function addCollectionItem(data: {
  collectionId: string
  itemType: CollectionItemType
  itemId: string
}): Promise<ActionResult<CollectionItem>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const collection = await prisma.collection.findUnique({
      where: { id: data.collectionId },
      select: { id: true },
    })

    if (!collection) {
      return { success: false, error: "Collection not found" }
    }

    const duplicate = await prisma.collectionItem.findFirst({
      where: {
        collectionId: data.collectionId,
        itemType: data.itemType,
        ...(data.itemType === "prompt"
          ? { promptId: data.itemId }
          : { moduleId: data.itemId }),
      },
    })

    if (duplicate) {
      return { success: false, error: "Item already exists in this collection" }
    }

    const targetExists =
      data.itemType === "prompt"
        ? await prisma.prompt.findUnique({ where: { id: data.itemId }, select: { id: true } })
        : await prisma.module.findUnique({ where: { id: data.itemId }, select: { id: true } })

    if (!targetExists) {
      return { success: false, error: `${data.itemType === "prompt" ? "Prompt" : "Module"} not found` }
    }

    const latestItem = await prisma.collectionItem.findFirst({
      where: { collectionId: data.collectionId },
      orderBy: { position: "desc" },
      select: { position: true },
    })

    const row = await prisma.collectionItem.create({
      data: {
        collectionId: data.collectionId,
        itemType: data.itemType,
        promptId: data.itemType === "prompt" ? data.itemId : null,
        moduleId: data.itemType === "module" ? data.itemId : null,
        position: (latestItem?.position ?? 0) + 1,
      },
      include: {
        prompt: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        module: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    })

    revalidateAll()
    return { success: true, data: deserializeCollectionItem(row) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function removeCollectionItem(
  collectionItemId: string
): Promise<ActionResult<{ id: string }>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    await prisma.collectionItem.delete({ where: { id: collectionItemId } })
    revalidateAll()
    return { success: true, data: { id: collectionItemId } }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function addModulesToCollection(
  collectionId: string,
  moduleIds: string[]
): Promise<ActionResult<{ collectionId: string; addedCount: number; skippedCount: number }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const uniqueModuleIds = Array.from(
      new Set(moduleIds.filter((moduleId) => typeof moduleId === "string" && moduleId.trim()))
    )

    if (uniqueModuleIds.length === 0) {
      return { success: false, error: "Select at least one module to add" }
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    })

    if (!collection) {
      return { success: false, error: "Collection not found" }
    }

    const [existingItems, existingModules, latestItem] = await Promise.all([
      prisma.collectionItem.findMany({
        where: {
          collectionId,
          itemType: "module",
          moduleId: { in: uniqueModuleIds },
        },
        select: { moduleId: true },
      }),
      prisma.module.findMany({
        where: { id: { in: uniqueModuleIds } },
        select: { id: true },
      }),
      prisma.collectionItem.findFirst({
        where: { collectionId },
        orderBy: { position: "desc" },
        select: { position: true },
      }),
    ])

    const existingModuleIds = new Set(existingItems.map((item) => item.moduleId).filter(Boolean))
    const validModuleIds = existingModules.map((module) => module.id)
    const moduleIdsToCreate = validModuleIds.filter((moduleId) => !existingModuleIds.has(moduleId))

    if (moduleIdsToCreate.length > 0) {
      await prisma.collectionItem.createMany({
        data: moduleIdsToCreate.map((moduleId, index) => ({
          collectionId,
          itemType: "module",
          promptId: null,
          moduleId,
          position: (latestItem?.position ?? 0) + index + 1,
        })),
      })
    }

    revalidateAll()

    return {
      success: true,
      data: {
        collectionId,
        addedCount: moduleIdsToCreate.length,
        skippedCount: uniqueModuleIds.length - moduleIdsToCreate.length,
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
