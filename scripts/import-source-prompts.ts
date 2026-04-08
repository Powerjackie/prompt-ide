import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

import { PrismaLibSql } from "@prisma/adapter-libsql"
import { config as loadEnv } from "dotenv"

import { PrismaClient } from "../src/generated/prisma/client"

const SOURCE = "aishort.top"
const SOURCE_LABEL = "AiShort"
const MODULE_TITLE_PREFIX = `${SOURCE_LABEL}: `
const ZH_URL =
  "https://raw.githubusercontent.com/rockbenben/ChatGPT-Shortcut/main/src/data/prompt_zh-Hans.json"
const EN_URL =
  "https://raw.githubusercontent.com/rockbenben/ChatGPT-Shortcut/main/src/data/prompt_en.json"

const TAG_TO_CATEGORY: Record<string, string> = {
  write: "writing",
  article: "writing",
  code: "code",
  ai: "ai",
  living: "lifestyle",
  interesting: "fun",
  life: "lifestyle",
  social: "psychology",
  philosophy: "philosophy",
  mind: "psychology",
  pedagogy: "education",
  academic: "education",
  games: "games",
  tool: "productivity",
  interpreter: "interpreter",
  language: "language",
  speech: "debate",
  comments: "review",
  text: "text",
  company: "communication",
  seo: "seo",
  doctor: "medical",
  finance: "finance",
  music: "music",
  professional: "professional",
  contribute: "general",
}

const TAG_TO_COLLECTION_TITLE: Record<string, string> = {
  write: "写作辅助",
  article: "文章/报告",
  code: "IT/编程",
  ai: "AI",
  living: "生活质量",
  interesting: "趣味科普",
  life: "生活百科",
  social: "心理/社交",
  philosophy: "哲学/宗教",
  mind: "思维训练",
  pedagogy: "教育/学生",
  academic: "学术/教师",
  games: "趣味游戏",
  tool: "效率工具",
  interpreter: "终端/解释器",
  language: "语言/翻译",
  speech: "辩论/演讲",
  comments: "点评/评鉴",
  text: "文本/词语",
  company: "企业职能",
  seo: "SEO",
  doctor: "医疗健康",
  finance: "金融顾问",
  music: "音乐艺术",
  professional: "专业顾问",
  contribute: "用户分享",
}

type ModuleKind = "role" | "output_format" | "constraint"

type LocalePayload = {
  title?: string
  prompt?: string
  description?: string
  remark?: string
}

type SourceRecord = {
  id: number
  website?: string | null
  tags?: string[]
  weight?: number
  en?: LocalePayload
  "zh-Hans"?: LocalePayload
}

type NormalizedPrompt = {
  id: string
  externalId: number
  title: string
  description: string
  content: string
  category: string
  tags: string[]
  notes: string
  englishPrompt: string
  chinesePrompt: string
}

type ModuleAccumulator = {
  sample: string
  count: number
  tags: Set<string>
}

type PreparedImport = {
  prompts: Array<{
    id: string
    title: string
    description: string
    content: string
    status: "production"
    source: string
    model: "universal"
    category: string
    tags: string
    notes: string
    variables: string
  }>
  collections: Array<{
    id: string
    tag: string
    title: string
    description: string
    type: "toolkit"
  }>
  modules: Array<{
    id: string
    title: string
    type: ModuleKind
    content: string
    tags: string
  }>
  collectionItems: Array<{
    collectionId: string
    itemType: "prompt"
    promptId: string
    position: number
  }>
  skippedMissingContent: number
  missingChineseTranslation: number
}

type CliOptions = {
  dryRun: boolean
  force: boolean
}

const FETCH_TIMEOUT_MS = 20_000
const FETCH_RETRIES = 3

function parseArgs(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes("--dry-run"),
    force: argv.includes("--force"),
  }
}

function loadEnvironment() {
  const envPath = resolve(process.cwd(), ".env")
  if (existsSync(envPath)) {
    loadEnv({ path: envPath })
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Run the script from the prompt-ide repo root.")
  }
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

function trimText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function buildContent(englishPrompt: string, chinesePrompt: string) {
  const hasChineseTranslation = chinesePrompt.length > 0 && chinesePrompt !== englishPrompt
  const content = hasChineseTranslation
    ? `[英文原文]\n${englishPrompt}\n\n[中文翻译]\n${chinesePrompt}`
    : `[英文原文]\n${englishPrompt}`

  return {
    content,
    translationMissing: !hasChineseTranslation,
  }
}

function buildNotes(website: string | null | undefined, translationMissing: boolean) {
  const notes: string[] = []

  if (website) {
    notes.push(website)
  }

  if (translationMissing) {
    notes.push("中文翻译缺失")
  }

  return notes.join("\n")
}

function selectPrimaryCategory(tags: string[]) {
  const firstNonFallback = tags.find((tag) => tag !== "contribute" && TAG_TO_CATEGORY[tag])
  if (firstNonFallback) return TAG_TO_CATEGORY[firstNonFallback]

  const firstKnown = tags.find((tag) => TAG_TO_CATEGORY[tag])
  return firstKnown ? TAG_TO_CATEGORY[firstKnown] : "general"
}

async function fetchSourceData(): Promise<NormalizedPrompt[]> {
  const [zhResponse, enResponse] = await Promise.all([fetchWithRetry(ZH_URL), fetchWithRetry(EN_URL)])

  if (!zhResponse.ok || !enResponse.ok) {
    throw new Error(`Failed to fetch source data: zh=${zhResponse.status} en=${enResponse.status}`)
  }

  const zhRecords = (await zhResponse.json()) as SourceRecord[]
  const enRecords = (await enResponse.json()) as SourceRecord[]
  const enById = new Map(enRecords.map((record) => [record.id, record]))
  const prompts: NormalizedPrompt[] = []

  for (const zhRecord of zhRecords) {
    const enRecord = enById.get(zhRecord.id)
    const englishPrompt = trimText(enRecord?.en?.prompt)
    const chinesePrompt = trimText(zhRecord["zh-Hans"]?.prompt)

    if (!englishPrompt && !chinesePrompt) {
      continue
    }

    const title =
      trimText(zhRecord["zh-Hans"]?.title) ||
      trimText(enRecord?.en?.title) ||
      `External Prompt ${zhRecord.id}`

    const description =
      trimText(zhRecord["zh-Hans"]?.description) ||
      trimText(zhRecord["zh-Hans"]?.remark) ||
      trimText(enRecord?.en?.description) ||
      trimText(enRecord?.en?.remark)

    const tags = (zhRecord.tags ?? []).filter(Boolean)
    const category = selectPrimaryCategory(tags)
    const { content, translationMissing } = buildContent(
      englishPrompt || chinesePrompt,
      chinesePrompt,
    )

    prompts.push({
      id: randomUUID(),
      externalId: zhRecord.id,
      title,
      description,
      content,
      category,
      tags,
      notes: buildNotes(zhRecord.website, translationMissing),
      englishPrompt: englishPrompt || chinesePrompt,
      chinesePrompt,
    })
  }

  return prompts
}

async function fetchWithRetry(url: string) {
  let lastError: unknown

  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`)
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt === FETCH_RETRIES) {
        break
      }
      await new Promise((resolveRetry) => setTimeout(resolveRetry, attempt * 1_000))
    }
  }

  throw lastError
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((value) => value.trim())
    .filter(Boolean)
}

function normalizeCandidate(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim()
}

function rankCandidates(
  map: Map<string, ModuleAccumulator>,
  limit: number,
): Array<{ content: string; tags: string[] }> {
  return [...map.values()]
    .sort((left, right) => right.count - left.count || left.sample.length - right.sample.length)
    .slice(0, limit)
    .map((entry) => ({
      content: entry.sample,
      tags: [...entry.tags].sort(),
    }))
}

function collectCandidates(items: NormalizedPrompt[], kind: ModuleKind) {
  const map = new Map<string, ModuleAccumulator>()

  const predicates: Record<ModuleKind, (sentence: string) => boolean> = {
    role: (sentence) => {
      const lower = sentence.toLowerCase()
      return (
        lower.includes("i want you to act as") ||
        lower.includes("act as") ||
        sentence.includes("你是一个")
      )
    },
    output_format: (sentence) => {
      const lower = sentence.toLowerCase()
      return (
        lower.includes("output format") ||
        lower.includes("format your response") ||
        lower.includes("reply with") ||
        lower.includes("respond in") ||
        lower.includes("code block") ||
        lower.includes("markdown") ||
        lower.includes("table") ||
        sentence.includes("格式") ||
        sentence.includes("表格")
      )
    },
    constraint: (sentence) => {
      const lower = sentence.toLowerCase()
      return (
        lower.includes("do not") ||
        lower.includes("avoid") ||
        lower.includes("must not") ||
        sentence.includes("不要") ||
        sentence.includes("禁止")
      )
    },
  }

  for (const item of items) {
    const pool = [...splitSentences(item.englishPrompt), ...splitSentences(item.chinesePrompt)]

    for (const sentence of pool) {
      if (!predicates[kind](sentence)) {
        continue
      }

      const key = normalizeCandidate(sentence)
      const current =
        map.get(key) ??
        ({
          sample: sentence,
          count: 0,
          tags: new Set<string>(),
        } satisfies ModuleAccumulator)

      current.count += 1
      for (const tag of item.tags) {
        current.tags.add(tag)
      }
      map.set(key, current)
    }
  }

  return rankCandidates(map, 10)
}

function buildModules(items: NormalizedPrompt[]) {
  const moduleKinds: ModuleKind[] = ["role", "output_format", "constraint"]
  const modules: PreparedImport["modules"] = []

  for (const kind of moduleKinds) {
    const candidates = collectCandidates(items, kind)

    candidates.forEach((candidate, index) => {
      modules.push({
        id: randomUUID(),
        title: `${MODULE_TITLE_PREFIX}${kind} ${index + 1}`,
        type: kind,
        content: candidate.content,
        tags: JSON.stringify(candidate.tags),
      })
    })
  }

  return modules
}

function buildCollections() {
  return Object.entries(TAG_TO_COLLECTION_TITLE).map(([tag, title]) => ({
    id: randomUUID(),
    tag,
    title,
    description: `从 ${SOURCE} 采集的${title}类提示词合集`,
    type: "toolkit" as const,
  }))
}

function prepareImport(items: NormalizedPrompt[]): PreparedImport {
  const skippedMissingContent = items.filter((item) => !item.englishPrompt).length
  const filteredItems = items.filter((item) => item.englishPrompt)
  const collections = buildCollections()
  const collectionsByTag = new Map(collections.map((collection) => [collection.tag, collection]))
  const prompts: PreparedImport["prompts"] = filteredItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    status: "production",
    source: SOURCE,
    model: "universal",
    category: item.category,
    tags: JSON.stringify(item.tags),
    notes: item.notes,
    variables: "[]",
  }))

  const collectionPositions = new Map<string, number>()
  const collectionItems: PreparedImport["collectionItems"] = []

  for (const item of filteredItems) {
    for (const tag of item.tags) {
      const collection = collectionsByTag.get(tag)
      if (!collection) {
        continue
      }

      const position = collectionPositions.get(tag) ?? 0
      collectionItems.push({
        collectionId: collection.id,
        itemType: "prompt",
        promptId: item.id,
        position,
      })
      collectionPositions.set(tag, position + 1)
    }
  }

  return {
    prompts,
    collections,
    modules: buildModules(filteredItems),
    collectionItems,
    skippedMissingContent,
    missingChineseTranslation: filteredItems.filter((item) => item.notes.includes("中文翻译缺失"))
      .length,
  }
}

function printStats(prepared: PreparedImport) {
  console.log(
    `Imported: ${prepared.prompts.length} prompts, ${prepared.collections.length} collections, ${prepared.modules.length} modules`,
  )
  console.log(`Skipped (no Chinese translation): ${prepared.missingChineseTranslation}`)
  console.log(`Skipped (no prompt content): ${prepared.skippedMissingContent}`)
  console.log(`Collection items created: ${prepared.collectionItems.length}`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  loadEnvironment()
  const prisma = createPrismaClient()

  try {
    const items = await fetchSourceData()
    const prepared = prepareImport(items)
    const existingCount = await prisma.prompt.count({
      where: { source: SOURCE },
    })

    if (!options.dryRun && existingCount > 0 && !options.force) {
      console.error(`已存在 ${existingCount} 条 ${SOURCE} 记录，使用 --force 覆盖`)
      process.exitCode = 1
      return
    }

    if (options.dryRun) {
      printStats(prepared)
      return
    }

    await prisma.$transaction(async (tx) => {
      if (options.force) {
        const existingCollections = await tx.collection.findMany({
          where: {
            OR: prepared.collections.map((collection) => ({
              title: collection.title,
              description: collection.description,
            })),
          },
          select: { id: true },
        })

        const existingModules = await tx.module.findMany({
          where: {
            title: {
              startsWith: MODULE_TITLE_PREFIX,
            },
          },
          select: { id: true },
        })

        if (existingCollections.length > 0) {
          await tx.collection.deleteMany({
            where: { id: { in: existingCollections.map((collection) => collection.id) } },
          })
        }

        if (existingModules.length > 0) {
          await tx.module.deleteMany({
            where: { id: { in: existingModules.map((module) => module.id) } },
          })
        }

        await tx.prompt.deleteMany({
          where: { source: SOURCE },
        })
      }

      await tx.collection.createMany({
        data: prepared.collections.map((collection) => ({
          id: collection.id,
          title: collection.title,
          description: collection.description,
          type: collection.type,
        })),
      })

      await tx.prompt.createMany({
        data: prepared.prompts,
      })

      if (prepared.modules.length > 0) {
        await tx.module.createMany({
          data: prepared.modules,
        })
      }

      if (prepared.collectionItems.length > 0) {
        await tx.collectionItem.createMany({
          data: prepared.collectionItems,
        })
      }
    })

    printStats(prepared)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
