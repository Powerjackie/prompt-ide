"use server"

import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import { deriveSkillHealth } from "@/lib/skill-health"
import { revalidatePath } from "next/cache"
import { deserializePromptSnapshot } from "@/lib/prompt-version"
import type {
  Skill,
  SkillDetail,
  SkillFormInput,
  SkillListItem,
  SkillRunContext,
  SkillRunRecord,
  SkillRunPreset,
  SkillSchemaMap,
  SkillStatus,
} from "@/types/skill"
import type { AgentAnalysisResult } from "@/types/agent"
import type { BenchmarkRun } from "@/types/benchmark"
import type { PromptVersion } from "@/types/prompt-version"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function revalidateAll() {
  revalidatePath("/[locale]", "layout")
}

const SKILL_RUN_STATE_KEY = "skill-run-state"

function parseSchema(value: string): SkillSchemaMap {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return Object.entries(parsed).reduce<SkillSchemaMap>((acc, [key, val]) => {
      if (key.trim().length > 0 && typeof val === "string") {
        acc[key] = val
      }
      return acc
    }, {})
  } catch {
    return {}
  }
}

function serializeSchema(schema?: SkillSchemaMap) {
  return JSON.stringify(schema ?? {})
}

interface SkillRunStateStore {
  recentValuesBySkillId: Record<string, Record<string, string>>
  presetsBySkillId: Record<string, SkillRunPreset[]>
  recentRunsBySkillId: Record<string, SkillRunRecord[]>
}

function createEmptySkillRunState(): SkillRunStateStore {
  return {
    recentValuesBySkillId: {},
    presetsBySkillId: {},
    recentRunsBySkillId: {},
  }
}

async function getSkillRunStateStore(): Promise<SkillRunStateStore> {
  const row = await prisma.setting.findUnique({ where: { key: SKILL_RUN_STATE_KEY } })

  if (!row) {
    return createEmptySkillRunState()
  }

  try {
    const parsed = JSON.parse(row.value) as Partial<SkillRunStateStore>
    return {
      recentValuesBySkillId: parsed.recentValuesBySkillId ?? {},
      presetsBySkillId: parsed.presetsBySkillId ?? {},
      recentRunsBySkillId: parsed.recentRunsBySkillId ?? {},
    }
  } catch {
    return createEmptySkillRunState()
  }
}

async function saveSkillRunStateStore(state: SkillRunStateStore) {
  await prisma.setting.upsert({
    where: { key: SKILL_RUN_STATE_KEY },
    create: {
      key: SKILL_RUN_STATE_KEY,
      value: JSON.stringify(state),
    },
    update: {
      value: JSON.stringify(state),
    },
  })
}

function deserializeBenchmarkRun(row: {
  id: string
  promptId: string
  promptVersionId: string
  evaluator: string
  input: string
  summary: string
  overallScore: number
  clarityScore: number
  reusabilityScore: number
  controllabilityScore: number
  deploymentReadinessScore: number
  improvementSuggestions: string
  recommendedForProduction: boolean
  rawOutput: string
  createdAt: Date
  promptVersion: {
    versionNumber: number
    changeSummary: string
  }
}): BenchmarkRun {
  return {
    id: row.id,
    promptId: row.promptId,
    promptVersionId: row.promptVersionId,
    promptVersionNumber: row.promptVersion.versionNumber,
    promptVersionChangeSummary: row.promptVersion.changeSummary,
    evaluator: row.evaluator,
    input: row.input,
    summary: row.summary,
    overallScore: row.overallScore,
    clarityScore: row.clarityScore,
    reusabilityScore: row.reusabilityScore,
    controllabilityScore: row.controllabilityScore,
    deploymentReadinessScore: row.deploymentReadinessScore,
    improvementSuggestions: JSON.parse(row.improvementSuggestions) as string[],
    recommendedForProduction: row.recommendedForProduction,
    rawOutput: JSON.parse(row.rawOutput) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  }
}

function deserializePromptVersion(row: {
  id: string
  promptId: string
  versionNumber: number
  isBaseline: boolean
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
    isBaseline: row.isBaseline,
    changeSummary: row.changeSummary,
    createdAt: row.createdAt.toISOString(),
    ...deserializePromptSnapshot(row),
  }
}

function deserializeSkill(row: {
  id: string
  name: string
  description: string
  goal: string
  status: string
  entryPromptId: string
  collectionId: string | null
  recommendedModel: string
  inputSchema: string
  outputSchema: string
  notes: string
  createdAt: Date
  updatedAt: Date
  entryPrompt: {
    id: string
    title: string
    description: string
  }
  collection?: {
    id: string
    title: string
    type: string
  } | null
}): Skill {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    goal: row.goal,
    status: row.status as SkillStatus,
    entryPromptId: row.entryPromptId,
    collectionId: row.collectionId,
    recommendedModel: row.recommendedModel,
    inputSchema: parseSchema(row.inputSchema),
    outputSchema: parseSchema(row.outputSchema),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    entryPrompt: {
      id: row.entryPrompt.id,
      title: row.entryPrompt.title,
      description: row.entryPrompt.description,
      href: `/prompts/${row.entryPrompt.id}`,
    },
    collection: row.collection
      ? {
          id: row.collection.id,
          title: row.collection.title,
          subtitle: row.collection.type,
          href: `/collections/${row.collection.id}`,
        }
      : null,
  }
}

function validateInput(data: SkillFormInput): string | null {
  if (!data.name.trim()) return "Skill name is required"
  if (!data.entryPromptId.trim()) return "Entry prompt is required"
  return null
}

export async function getSkills(): Promise<ActionResult<SkillListItem[]>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rows = await prisma.skill.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        entryPrompt: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    })

    const promptIds = rows.map((row) => row.entryPromptId)
    const skillRunState = await getSkillRunStateStore()
    const [latestBenchmarkRows, baselineVersionRows] = await Promise.all([
      prisma.benchmarkRun.findMany({
        where: { promptId: { in: promptIds } },
        orderBy: [{ promptId: "asc" }, { createdAt: "desc" }],
        include: {
          promptVersion: {
            select: {
              versionNumber: true,
              changeSummary: true,
            },
          },
        },
      }),
      prisma.promptVersion.findMany({
        where: { promptId: { in: promptIds }, isBaseline: true },
        orderBy: [{ promptId: "asc" }, { versionNumber: "desc" }],
      }),
    ])

    const latestBenchmarkByPromptId = new Map<string, BenchmarkRun>()
    for (const row of latestBenchmarkRows) {
      if (!latestBenchmarkByPromptId.has(row.promptId)) {
        latestBenchmarkByPromptId.set(row.promptId, deserializeBenchmarkRun(row))
      }
    }

    const baselineVersionByPromptId = new Map<string, PromptVersion>()
    for (const row of baselineVersionRows) {
      if (!baselineVersionByPromptId.has(row.promptId)) {
        baselineVersionByPromptId.set(row.promptId, deserializePromptVersion(row))
      }
    }

    const skills: SkillListItem[] = rows.map((row) => {
      const skill = deserializeSkill(row)
      const recentRun = (skillRunState.recentRunsBySkillId[skill.id] ?? [])[0] ?? null

      return {
        ...skill,
        health: deriveSkillHealth({
          latestBenchmark: latestBenchmarkByPromptId.get(skill.entryPromptId) ?? null,
          baselineVersion: baselineVersionByPromptId.get(skill.entryPromptId) ?? null,
          recentRun,
        }),
      }
    })

    return { success: true, data: skills }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getSkillById(id: string): Promise<ActionResult<SkillDetail>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.skill.findUnique({
      where: { id },
      include: {
        entryPrompt: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    })

    if (!row) {
      return { success: false, error: "Skill not found" }
    }

    const [latestBenchmarkRow, baselineVersionRow, skillRunState] = await Promise.all([
      prisma.benchmarkRun.findFirst({
        where: { promptId: row.entryPromptId },
        orderBy: { createdAt: "desc" },
        include: {
          promptVersion: {
            select: {
              versionNumber: true,
              changeSummary: true,
            },
          },
        },
      }),
      prisma.promptVersion.findFirst({
        where: { promptId: row.entryPromptId, isBaseline: true },
        orderBy: { versionNumber: "desc" },
      }),
      getSkillRunStateStore(),
    ])

    return {
      success: true,
      data: {
        skill: deserializeSkill(row),
        latestBenchmark: latestBenchmarkRow ? deserializeBenchmarkRun(latestBenchmarkRow) : null,
        baselineVersion: baselineVersionRow ? deserializePromptVersion(baselineVersionRow) : null,
        recentRuns: skillRunState.recentRunsBySkillId[id] ?? [],
        health: deriveSkillHealth({
          latestBenchmark: latestBenchmarkRow ? deserializeBenchmarkRun(latestBenchmarkRow) : null,
          baselineVersion: baselineVersionRow ? deserializePromptVersion(baselineVersionRow) : null,
          recentRun: (skillRunState.recentRunsBySkillId[id] ?? [])[0] ?? null,
        }),
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getSkillRunContext(id: string): Promise<ActionResult<SkillRunContext>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const detailResult = await getSkillById(id)
    if (!detailResult.success) {
      return detailResult
    }

    const entryPrompt = await prisma.prompt.findUnique({
      where: { id: detailResult.data.skill.entryPromptId },
      select: {
        content: true,
        variables: true,
      },
    })

    if (!entryPrompt) {
      return { success: false, error: "Entry prompt not found" }
    }

    const skillRunState = await getSkillRunStateStore()

    return {
      success: true,
      data: {
        ...detailResult.data,
        entryPromptContent: entryPrompt.content,
        entryPromptVariables: JSON.parse(entryPrompt.variables) as SkillRunContext["entryPromptVariables"],
        recentValues: skillRunState.recentValuesBySkillId[id] ?? null,
        presets: skillRunState.presetsBySkillId[id] ?? [],
        recentRuns: skillRunState.recentRunsBySkillId[id] ?? [],
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function saveRecentSkillRunValues(
  skillId: string,
  values: Record<string, string>
): Promise<ActionResult<{ skillId: string; values: Record<string, string> }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const state = await getSkillRunStateStore()
    state.recentValuesBySkillId[skillId] = Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) => key.trim().length > 0 && typeof value === "string"
      )
    )
    await saveSkillRunStateStore(state)
    return { success: true, data: { skillId, values: state.recentValuesBySkillId[skillId] } }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function saveSkillRunRecord(
  skillId: string,
  values: Record<string, string>,
  renderedPrompt: string,
  analysis: AgentAnalysisResult
): Promise<ActionResult<SkillRunRecord>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const state = await getSkillRunStateStore()
    const nextRecord: SkillRunRecord = {
      id: crypto.randomUUID(),
      values: Object.fromEntries(
        Object.entries(values).filter(
          ([key, value]) => key.trim().length > 0 && typeof value === "string"
        )
      ),
      renderedPrompt,
      summary:
        analysis.suggestedDescription ||
        analysis.suggestedTitle ||
        "MiniMax completed a stateless skill validation run.",
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence,
      createdAt: new Date().toISOString(),
    }

    const existing = state.recentRunsBySkillId[skillId] ?? []
    state.recentRunsBySkillId[skillId] = [nextRecord, ...existing].slice(0, 5)
    await saveSkillRunStateStore(state)

    return { success: true, data: nextRecord }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function saveSkillRunPreset(
  skillId: string,
  name: string,
  values: Record<string, string>
): Promise<ActionResult<SkillRunPreset>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  if (!name.trim()) {
    return { success: false, error: "Preset name is required" }
  }

  try {
    const state = await getSkillRunStateStore()
    const nextPreset: SkillRunPreset = {
      id: crypto.randomUUID(),
      name: name.trim(),
      values: Object.fromEntries(
        Object.entries(values).filter(
          ([key, value]) => key.trim().length > 0 && typeof value === "string"
        )
      ),
      updatedAt: new Date().toISOString(),
    }

    const existing = state.presetsBySkillId[skillId] ?? []
    state.presetsBySkillId[skillId] = [nextPreset, ...existing].slice(0, 8)
    await saveSkillRunStateStore(state)

    return { success: true, data: nextPreset }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteSkillRunPreset(
  skillId: string,
  presetId: string
): Promise<ActionResult<{ skillId: string; presetId: string }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const state = await getSkillRunStateStore()
    state.presetsBySkillId[skillId] = (state.presetsBySkillId[skillId] ?? []).filter(
      (preset) => preset.id !== presetId
    )
    await saveSkillRunStateStore(state)
    return { success: true, data: { skillId, presetId } }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function createSkill(data: SkillFormInput): Promise<ActionResult<Skill>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  const validationError = validateInput(data)
  if (validationError) {
    return { success: false, error: validationError }
  }

  try {
    const row = await prisma.skill.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() ?? "",
        goal: data.goal?.trim() ?? "",
        status: data.status ?? "draft",
        entryPromptId: data.entryPromptId,
        collectionId: data.collectionId ?? null,
        recommendedModel: data.recommendedModel ?? "universal",
        inputSchema: serializeSchema(data.inputSchema),
        outputSchema: serializeSchema(data.outputSchema),
        notes: data.notes?.trim() ?? "",
      },
      include: {
        entryPrompt: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    })

    revalidateAll()
    return { success: true, data: deserializeSkill(row) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updateSkill(
  id: string,
  data: Partial<SkillFormInput>
): Promise<ActionResult<Skill>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await prisma.skill.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Skill not found" }
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description.trim()
    if (data.goal !== undefined) updateData.goal = data.goal.trim()
    if (data.status !== undefined) updateData.status = data.status
    if (data.entryPromptId !== undefined) updateData.entryPromptId = data.entryPromptId
    if (data.collectionId !== undefined) updateData.collectionId = data.collectionId ?? null
    if (data.recommendedModel !== undefined) updateData.recommendedModel = data.recommendedModel
    if (data.inputSchema !== undefined) updateData.inputSchema = serializeSchema(data.inputSchema)
    if (data.outputSchema !== undefined) updateData.outputSchema = serializeSchema(data.outputSchema)
    if (data.notes !== undefined) updateData.notes = data.notes.trim()

    const row = await prisma.skill.update({
      where: { id },
      data: updateData,
      include: {
        entryPrompt: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    })

    revalidateAll()
    return { success: true, data: deserializeSkill(row) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteSkill(id: string): Promise<ActionResult<{ id: string }>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.skill.delete({ where: { id } })
    revalidateAll()
    return { success: true, data: { id } }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function createSkillFromPrompt(promptId: string): Promise<ActionResult<Skill>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: {
        id: true,
        title: true,
        description: true,
        model: true,
      },
    })

    if (!prompt) {
      return { success: false, error: "Prompt not found" }
    }

    const existing = await prisma.skill.findFirst({
      where: { entryPromptId: promptId },
      orderBy: { updatedAt: "desc" },
      include: {
        entryPrompt: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    })

    if (existing) {
      return { success: true, data: deserializeSkill(existing) }
    }

    const row = await prisma.skill.create({
      data: {
        name: prompt.title,
        description: prompt.description,
        goal: prompt.description || `Run ${prompt.title} as a reusable capability.`,
        entryPromptId: prompt.id,
        recommendedModel: prompt.model,
      },
      include: {
        entryPrompt: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    })

    revalidateAll()
    return { success: true, data: deserializeSkill(row) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function attachCollectionToSkill(
  skillId: string,
  collectionId: string | null
): Promise<ActionResult<Skill>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    if (collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        select: { id: true },
      })

      if (!collection) {
        return { success: false, error: "Collection not found" }
      }
    }

    const row = await prisma.skill.update({
      where: { id: skillId },
      data: {
        collectionId: collectionId ?? null,
      },
      include: {
        entryPrompt: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    })

    revalidateAll()
    return { success: true, data: deserializeSkill(row) }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
