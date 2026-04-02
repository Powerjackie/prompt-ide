import OpenAI from "openai"
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions"
import { prisma } from "@/lib/prisma"
import type {
  AgentAnalysisResult,
  AgentRunOutput,
  AgentReason,
  AgentSummaryPart,
  AgentTrajectoryStep,
  ModuleCandidate,
  TrajectoryPhase,
} from "@/types/agent"
import type { BenchmarkResult } from "@/types/benchmark"
import type { ModuleType } from "@/types/module"
import type { Variable } from "@/types/prompt"
import type { PromptVersionSnapshot } from "@/types/prompt-version"
import type {
  CleanedPromptDraft,
  PromptRefactorResult,
  PromptRefactorRunOutput,
  RefactorModuleSuggestion,
} from "@/types/refactor"

export interface AgentRunResult {
  analysis: AgentAnalysisResult
  trajectory: AgentTrajectoryStep[]
  output: AgentRunOutput
}

export interface PromptRefactorRunResult {
  proposal: PromptRefactorResult
  trajectory: AgentTrajectoryStep[]
  output: PromptRefactorRunOutput
}

interface ModuleAwareLoopResult {
  finalText: string
  trajectory: AgentTrajectoryStep[]
  usedModuleTool: boolean
  fallbackModuleCandidates: ModuleCandidate[]
  termination: "final" | "missing_client" | "iteration_limit"
}

const MINIMAX_BASE_URL = "https://api.minimax.chat/v1"
const MINIMAX_MODEL = "MiniMax-M2.7"
const SEARCH_PROMPT_MODULES_TOOL = "search_prompt_modules"
const MAX_REACT_ITERATIONS = 5
const MAX_MODULE_RESULTS = 5
const MINIMAX_ANALYSIS_TIMEOUT_MS = 45_000
const MINIMAX_BENCHMARK_TIMEOUT_MS = 90_000
const MINIMAX_REFACTOR_TIMEOUT_MS = 120_000
export type NarrationLocale = "zh" | "en"

const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: SEARCH_PROMPT_MODULES_TOOL,
      description:
        "Search the saved prompt module library for reusable building blocks relevant to the current prompt before finalizing the analysis.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: {
            type: "string",
            description:
              "A short search query with the most relevant module keywords, roles, constraints, or task phrases from the prompt.",
          },
        },
        required: ["query"],
      },
    },
  },
]

function createNarrationLanguagePolicy(locale: NarrationLocale) {
  const targetLanguage =
    locale === "zh" ? "Simplified Chinese" : "English"

  return `
Language policy:
- The caller-selected UI locale is "${locale}".
- Use ${targetLanguage} for all reasoning, trajectory-visible thoughts/actions/observations, and every free-text JSON value.
- Never switch narrative language based on the prompt body unless the caller changes the locale.
- Never translate required JSON field names, enum values, or UI translation keys.
`.trim()
}

function createAgentSystemPrompt(locale: NarrationLocale) {
  return `
You are a Prompt Engineering Expert running a ReAct analysis loop for a personal prompt vault.

Operating rules:
1. You MUST use the search_prompt_modules tool before you finalize the analysis.
2. Use the tool to inspect reusable saved modules that may apply to the prompt.
3. After you receive tool observations, produce the final answer as JSON only.
4. Do not wrap the JSON in markdown fences.
5. Match the exact AgentAnalysisResult shape and field names below.

Required JSON shape:
{
  "suggestedTitle": "string",
  "suggestedDescription": "string",
  "suggestedCategory": "string",
  "suggestedTags": ["string"],
  "suggestedModel": "string",
  "suggestedStatus": "inbox | production | archived",
  "riskLevel": "low | medium | high",
  "confidence": 0.0,
  "extractedVariables": [
    { "name": "string", "description": "string", "defaultValue": "string" }
  ],
  "duplicateCandidates": [
    { "id": "string", "title": "string", "similarity": 0.0 }
  ],
  "moduleCandidates": [
    { "type": "string", "content": "string" }
  ],
  "normalizedContent": "string or null",
  "reviewRequired": true,
  "summaryParts": [
    { "key": "summaryCategory", "params": { "category": "string" } }
  ],
  "reasons": [
    { "key": "string", "params": {} }
  ],
  "matchedRules": ["string"],
  "analysisVersion": "string",
  "analyzedAt": "ISO timestamp string"
}

Guidance:
- Use concise, user-facing suggestions.
- Keep duplicateCandidates empty unless you have direct evidence.
- Use moduleCandidates to surface the most reusable matched module snippets.
- Use summaryParts keys that already exist in the UI, such as summaryCategory, summaryVariables, summaryRisk, summaryDuplicates, and summaryNormalize.
- Set analysisVersion to "minimax-2.7-react-v1".

${createNarrationLanguagePolicy(locale)}
`.trim()
}

function createBenchmarkSystemPrompt(locale: NarrationLocale) {
  return `
You are a prompt engineering evaluator for a personal Prompt IDE.

Your job is to score a single saved prompt version for production readiness.

Return JSON only with this exact shape:
{
  "overallScore": 0,
  "clarityScore": 0,
  "reusabilityScore": 0,
  "controllabilityScore": 0,
  "deploymentReadinessScore": 0,
  "summary": "string",
  "improvementSuggestions": ["string"],
  "recommendedForProduction": false
}

Scoring rules:
- Use integer scores from 0 to 100.
- clarity: is the prompt understandable and well-structured?
- reusability: can it be reused with minor changes?
- controllability: does it constrain output behavior clearly?
- deploymentReadiness: can it be safely promoted with minimal cleanup?
- overallScore should reflect the weighted quality of the prompt as a whole.

Be specific, concise, and practical.
Do not wrap JSON in markdown.

${createNarrationLanguagePolicy(locale)}
`.trim()
}

function createRefactorSystemPrompt(locale: NarrationLocale) {
  return `
You are a Prompt Refactor Expert for a personal Prompt IDE.

Operating rules:
1. You MUST use the search_prompt_modules tool before you finalize the refactor proposal.
2. Use the tool to check whether reusable ideas already exist in the saved module library.
3. After you receive tool observations, produce the final answer as JSON only.
4. Do not wrap the JSON in markdown fences.
5. Match the exact PromptRefactorResult shape and field names below.
6. extractedModules.type must be one of: role, goal, constraint, output_format, style, self_check.

Required JSON shape:
{
  "summary": "string",
  "cleanedPromptDraft": {
    "title": "string",
    "description": "string",
    "content": "string",
    "tags": ["string"]
  },
  "suggestedVariables": [
    { "name": "string", "description": "string", "defaultValue": "string" }
  ],
  "extractedModules": [
    {
      "title": "string",
      "type": "role | goal | constraint | output_format | style | self_check",
      "content": "string",
      "tags": ["string"],
      "rationale": "string"
    }
  ],
  "analysisVersion": "string",
  "generatedAt": "ISO timestamp string"
}

Guidance:
- summary should explain what changed and why.
- cleanedPromptDraft should keep the user's intent intact while making the prompt more structured and deployable.
- suggestedVariables should focus on reusable input slots.
- extractedModules should only include high-value reusable building blocks.
- Set analysisVersion to "minimax-2.7-refactor-v1".

${createNarrationLanguagePolicy(locale)}
`.trim()
}

function createMiniMaxClient(timeout = MINIMAX_ANALYSIS_TIMEOUT_MS) {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) return null

  return new OpenAI({
    apiKey,
    baseURL: MINIMAX_BASE_URL,
    timeout,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function clampConfidence(value: unknown, fallback = 0.62) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(1, Math.max(0, value))
}

function clampScore(value: unknown, fallback = 72) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(100, Math.max(0, Math.round(value)))
}

function localizeNarration(locale: NarrationLocale, zh: string, en: string) {
  return locale === "en" ? en : zh
}

function inferNarrationLocale(text: string): NarrationLocale {
  const englishPatterns = [
    /\b(?:think|reason|analy[sz]e|analysis|reply|respond|write|output|return)\s+(?:in|using)\s+english\b/i,
    /\b(?:please\s+)?use\s+english\s+for\s+(?:analysis|reasoning|thoughts?|response|output)\b/i,
    /(?:请|请用|用|使用|以)英文(?:进行)?(?:分析|思考|回答|输出)/,
  ]

  return englishPatterns.some((pattern) => pattern.test(text)) ? "en" : "zh"
}

function resolveNarrationLocale(
  locale?: string | null,
  fallbackText = ""
): NarrationLocale {
  if (locale === "zh" || locale === "en") {
    return locale
  }

  return inferNarrationLocale(fallbackText)
}

function normalizeRiskLevel(value: unknown): AgentAnalysisResult["riskLevel"] {
  return value === "medium" || value === "high" ? value : "low"
}

function ensureString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function ensureStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function parseModuleTags(tags: string) {
  return safeJsonParse<string[]>(tags, []).filter((tag) => typeof tag === "string" && tag.trim())
}

function summarizeText(text: string, maxLength = 240) {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 3)}...`
}

function stripCodeFences(text: string) {
  const trimmed = text.trim()
  if (!trimmed.startsWith("```")) return trimmed

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
}

function extractJsonCandidate(text: string) {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null

  return text.slice(start, end + 1)
}

function sanitizeModelReasoning(text: string) {
  const withoutClosedThinking = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  if (withoutClosedThinking && withoutClosedThinking !== text) {
    return withoutClosedThinking
  }

  if (text.includes("<think>")) {
    return ""
  }

  return text.trim()
}

function deriveTitle(promptContent: string, locale: NarrationLocale = "zh") {
  const firstLine = promptContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) {
    return localizeNarration(locale, "MiniMax 提示词分析", "MiniMax Prompt Analysis")
  }
  return firstLine.length > 72 ? `${firstLine.slice(0, 69)}...` : firstLine
}

function extractVariablesFromPrompt(
  promptContent: string,
  locale: NarrationLocale = "zh"
): Variable[] {
  const matches = Array.from(promptContent.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g))
  const uniqueNames = Array.from(new Set(matches.map((match) => match[1]).filter(Boolean)))

  return uniqueNames.map((name) => ({
    name,
    description: localizeNarration(
      locale,
      `从提示词占位符 ${name} 提取出的变量。`,
      `Variable extracted from prompt placeholder ${name}.`
    ),
    defaultValue: "",
  }))
}

function createSummaryParts(
  category: string,
  variables: Variable[],
  riskLevel: AgentAnalysisResult["riskLevel"],
  normalizedContent: string | null,
  duplicateCount: number
): AgentSummaryPart[] {
  const parts: AgentSummaryPart[] = [{ key: "summaryCategory", params: { category } }]

  if (variables.length > 0) {
    parts.push({ key: "summaryVariables", params: { count: variables.length } })
  }

  if (riskLevel !== "low") {
    parts.push({ key: "summaryRisk", params: { level: riskLevel } })
  }

  if (duplicateCount > 0) {
    parts.push({ key: "summaryDuplicates", params: { count: duplicateCount } })
  }

  if (normalizedContent) {
    parts.push({ key: "summaryNormalize" })
  }

  return parts
}

function normalizeModuleCandidates(value: unknown, fallback: ModuleCandidate[] = []) {
  if (!Array.isArray(value)) return fallback

  return value
    .filter(isRecord)
    .map((candidate) => ({
      type: ensureString(candidate.type, "reference"),
      content: ensureString(candidate.content, ""),
    }))
    .filter((candidate) => candidate.content.length > 0)
}

function normalizeReasons(value: unknown): AgentReason[] {
  if (!Array.isArray(value)) return []

  const normalized = value
    .filter(isRecord)
    .map((reason): AgentReason | null => {
      const key = ensureString(reason.key, "")
      if (!key) return null

      const params = isRecord(reason.params) ? reason.params : undefined
      return {
        key,
        params: params as Record<string, string | number> | undefined,
      }
    })

  return normalized.filter((reason): reason is AgentReason => reason !== null)
}

function normalizeSummaryParts(value: unknown, fallback: AgentSummaryPart[]) {
  if (!Array.isArray(value)) return fallback

  const normalized = value
    .filter(isRecord)
    .map((part): AgentSummaryPart | null => {
      const key = ensureString(part.key, "")
      if (!key) return null

      const params = isRecord(part.params) ? part.params : undefined
      return {
        key,
        params: params as Record<string, string | number> | undefined,
      }
    })

  const filtered = normalized.filter((part): part is AgentSummaryPart => part !== null)

  return filtered.length > 0 ? filtered : fallback
}

function normalizeAnalysis(
  parsed: unknown,
  promptContent: string,
  finalThought: string,
  fallbackModuleCandidates: ModuleCandidate[],
  usedModuleTool: boolean,
  locale: NarrationLocale
): AgentAnalysisResult {
  const now = new Date().toISOString()
  const source = isRecord(parsed) ? parsed : {}
  const extractedVariables = Array.isArray(source.extractedVariables)
    ? source.extractedVariables
        .filter(isRecord)
        .map((variable) => ({
          name: ensureString(variable.name, ""),
          description: ensureString(variable.description, ""),
          defaultValue: ensureString(variable.defaultValue, ""),
        }))
        .filter((variable) => variable.name.length > 0)
    : extractVariablesFromPrompt(promptContent, locale)

  const duplicateCandidates = Array.isArray(source.duplicateCandidates)
    ? source.duplicateCandidates
        .filter(isRecord)
        .map((candidate) => ({
          id: ensureString(candidate.id, ""),
          title: ensureString(candidate.title, "Untitled prompt"),
          similarity:
            typeof candidate.similarity === "number" && !Number.isNaN(candidate.similarity)
              ? Math.min(1, Math.max(0, candidate.similarity))
              : 0,
        }))
        .filter((candidate) => candidate.id.length > 0)
    : []

  const moduleCandidates = normalizeModuleCandidates(source.moduleCandidates, fallbackModuleCandidates)
  const normalizedContent =
    typeof source.normalizedContent === "string" && source.normalizedContent.trim()
      ? source.normalizedContent.trim()
      : null
  const riskLevel = normalizeRiskLevel(source.riskLevel)
  const reviewRequired =
    typeof source.reviewRequired === "boolean"
      ? source.reviewRequired
      : riskLevel !== "low" || duplicateCandidates.length > 0
  const summaryParts = createSummaryParts(
    ensureString(source.suggestedCategory, "general"),
    extractedVariables,
    riskLevel,
    normalizedContent,
    duplicateCandidates.length
  )
  const matchedRules = ensureStringArray(source.matchedRules, []).concat([
    "agent:minimax-2.7-react",
    ...(usedModuleTool ? ["agent:tool:search_prompt_modules"] : []),
  ])

  return {
    suggestedTitle: ensureString(source.suggestedTitle, deriveTitle(promptContent, locale)),
    suggestedDescription: ensureString(
      source.suggestedDescription,
      summarizeText(finalThought || "MiniMax generated a structured prompt analysis.", 160)
    ),
    suggestedCategory: ensureString(source.suggestedCategory, "general"),
    suggestedTags: ensureStringArray(source.suggestedTags, ["minimax", "react"]),
    suggestedModel: ensureString(source.suggestedModel, "universal"),
    suggestedStatus: ensureString(source.suggestedStatus, "inbox"),
    riskLevel,
    confidence: clampConfidence(source.confidence),
    extractedVariables,
    duplicateCandidates,
    moduleCandidates,
    normalizedContent,
    reviewRequired,
    summaryParts: normalizeSummaryParts(source.summaryParts, summaryParts),
    reasons: normalizeReasons(source.reasons),
    matchedRules: Array.from(new Set(matchedRules)),
    analysisVersion: ensureString(source.analysisVersion, "minimax-2.7-react-v1"),
    analyzedAt: ensureString(source.analyzedAt, now),
  }
}

function createFallbackAnalysis(
  promptContent: string,
  finalThought: string,
  moduleCandidates: ModuleCandidate[],
  usedModuleTool: boolean,
  locale: NarrationLocale
) {
  return normalizeAnalysis({}, promptContent, finalThought, moduleCandidates, usedModuleTool, locale)
}

function normalizeBenchmarkResult(
  parsed: unknown,
  snapshot: PromptVersionSnapshot,
  locale: NarrationLocale
): BenchmarkResult {
  const source = isRecord(parsed) ? parsed : {}
  const clarityScore = clampScore(source.clarityScore, snapshot.content.length > 120 ? 78 : 68)
  const reusabilityScore = clampScore(
    source.reusabilityScore,
    snapshot.variables.length > 0 || snapshot.tags.length > 0 ? 80 : 66
  )
  const controllabilityScore = clampScore(
    source.controllabilityScore,
    /\b(must|always|never|format|step|daily|schedule)\b/i.test(snapshot.content) ? 79 : 67
  )
  const deploymentReadinessScore = clampScore(
    source.deploymentReadinessScore,
    snapshot.notes.trim() || snapshot.description.trim() ? 77 : 64
  )
  const derivedOverall = Math.round(
    (clarityScore + reusabilityScore + controllabilityScore + deploymentReadinessScore) / 4
  )

  return {
    overallScore: clampScore(source.overallScore, derivedOverall),
    clarityScore,
    reusabilityScore,
    controllabilityScore,
    deploymentReadinessScore,
    summary: ensureString(
      source.summary,
      localizeNarration(
        locale,
        `MiniMax 将这个提示词评估为一个${derivedOverall >= 80 ? "较强" : "仍在发展中"}的可重复复用候选。`,
        `MiniMax benchmarked this prompt as a ${derivedOverall >= 80 ? "strong" : "developing"} candidate for repeated use.`
      )
    ),
    improvementSuggestions: ensureStringArray(
      source.improvementSuggestions,
      locale === "en"
        ? [
            "Clarify the output structure and response constraints.",
            "Add reusable variable placeholders for user-specific inputs.",
          ]
        : [
            "进一步明确输出结构和响应约束。",
            "为用户输入补充可复用的变量占位符。",
          ]
    ),
    recommendedForProduction:
      typeof source.recommendedForProduction === "boolean"
        ? source.recommendedForProduction
        : derivedOverall >= 80,
    evaluator: MINIMAX_MODEL,
    rawOutput: source,
  }
}

function normalizeVariables(value: unknown, fallback: Variable[] = []): Variable[] {
  if (!Array.isArray(value)) return fallback

  return value
    .filter(isRecord)
    .map((variable) => ({
      name: ensureString(variable.name, ""),
      description: ensureString(variable.description, ""),
      defaultValue: ensureString(variable.defaultValue, ""),
    }))
    .filter((variable) => variable.name.length > 0)
}

const MODULE_TYPES: ModuleType[] = [
  "role",
  "goal",
  "constraint",
  "output_format",
  "style",
  "self_check",
]

function normalizeModuleType(value: unknown): ModuleType {
  if (typeof value !== "string") return "goal"

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_")
  if (MODULE_TYPES.includes(normalized as ModuleType)) {
    return normalized as ModuleType
  }

  if (normalized.includes("role") || normalized.includes("persona")) return "role"
  if (normalized.includes("goal") || normalized.includes("objective")) return "goal"
  if (normalized.includes("constraint") || normalized.includes("guardrail")) return "constraint"
  if (normalized.includes("output")) return "output_format"
  if (normalized.includes("style") || normalized.includes("tone")) return "style"
  if (normalized.includes("self") || normalized.includes("check")) return "self_check"

  return "goal"
}

function buildRefactorFallbackModules(
  fallbackModuleCandidates: ModuleCandidate[],
  locale: NarrationLocale
): RefactorModuleSuggestion[] {
  return fallbackModuleCandidates.map((candidate, index) => ({
    title: localizeNarration(
      locale,
      `可复用${candidate.type}模块 ${index + 1}`,
      `Reusable ${candidate.type} module ${index + 1}`
    ),
    type: normalizeModuleType(candidate.type),
    content: candidate.content,
    tags: [candidate.type, "refactor"],
    rationale: localizeNarration(
      locale,
      "这是根据仓库里最接近的已保存模块生成的复用建议。",
      "Suggested from the closest reusable module already saved in the vault."
    ),
  }))
}

function normalizeRefactorModules(
  value: unknown,
  fallbackModuleCandidates: ModuleCandidate[],
  locale: NarrationLocale
): RefactorModuleSuggestion[] {
  if (!Array.isArray(value)) {
    return buildRefactorFallbackModules(fallbackModuleCandidates, locale)
  }

  const normalized = value
    .filter(isRecord)
    .map((module): RefactorModuleSuggestion | null => {
      const content = ensureString(module.content, "")
      if (!content) return null

      return {
        title: ensureString(
          module.title,
          localizeNarration(locale, "可复用提示词模块", "Reusable prompt module")
        ),
        type: normalizeModuleType(module.type),
        content,
        tags: ensureStringArray(module.tags, []),
        rationale: ensureString(
          module.rationale,
          localizeNarration(
            locale,
            "MiniMax 识别出这一段可以沉淀为可复用模块。",
            "MiniMax identified this section as a reusable building block."
          )
        ),
      }
    })
    .filter((module): module is RefactorModuleSuggestion => module !== null)

  return normalized.length > 0
    ? normalized
    : buildRefactorFallbackModules(fallbackModuleCandidates, locale)
}

function normalizeCleanedPromptDraft(
  value: unknown,
  promptContent: string,
  finalThought: string,
  locale: NarrationLocale
): CleanedPromptDraft {
  const source = isRecord(value) ? value : {}

  return {
    title: ensureString(source.title, deriveTitle(promptContent, locale)),
    description: ensureString(
      source.description,
      summarizeText(
        finalThought ||
          localizeNarration(
            locale,
            "MiniMax 已准备好一份更清晰的提示词草稿。",
            "MiniMax prepared a cleaned prompt draft."
          ),
        160
      )
    ),
    content: ensureString(source.content, promptContent.trim() || promptContent),
    tags: ensureStringArray(source.tags, ["refactor", "minimax"]),
  }
}

function normalizeRefactorResult(
  parsed: unknown,
  promptContent: string,
  finalThought: string,
  fallbackModuleCandidates: ModuleCandidate[],
  locale: NarrationLocale
): PromptRefactorResult {
  const now = new Date().toISOString()
  const source = isRecord(parsed) ? parsed : {}
  const cleanedPromptDraft = normalizeCleanedPromptDraft(
    source.cleanedPromptDraft,
    promptContent,
    finalThought,
    locale
  )

  return {
    summary: ensureString(
      source.summary,
      summarizeText(
        finalThought ||
          localizeNarration(
            locale,
            "MiniMax 已生成一份提示词重构提案。",
            "MiniMax generated a prompt refactor proposal."
          ),
        180
      )
    ),
    cleanedPromptDraft,
    suggestedVariables: normalizeVariables(
      source.suggestedVariables,
      extractVariablesFromPrompt(cleanedPromptDraft.content, locale)
    ),
    extractedModules: normalizeRefactorModules(
      source.extractedModules,
      fallbackModuleCandidates,
      locale
    ),
    analysisVersion: ensureString(source.analysisVersion, "minimax-2.7-refactor-v1"),
    generatedAt: ensureString(source.generatedAt, now),
  }
}

function createFallbackRefactor(
  promptContent: string,
  finalThought: string,
  fallbackModuleCandidates: ModuleCandidate[],
  locale: NarrationLocale
) {
  return normalizeRefactorResult({}, promptContent, finalThought, fallbackModuleCandidates, locale)
}

function pushTrajectoryStep(
  trajectory: AgentTrajectoryStep[],
  phase: TrajectoryPhase,
  content: string,
  tool: string | null = null,
  input: Record<string, unknown> | null = null,
  data: Record<string, unknown> | null = null
) {
  trajectory.push({
    step: trajectory.length + 1,
    phase,
    content,
    tool,
    input,
    data,
    timestamp: new Date().toISOString(),
  })
}

async function runModuleAwareLoop(options: {
  systemPrompt: string
  userPrompt: string
  promptContent: string
  promptId: string
  missingClientThought: string
  narrationLocale: NarrationLocale
  timeoutMs?: number
}): Promise<ModuleAwareLoopResult> {
  const client = createMiniMaxClient(options.timeoutMs)
  const trajectory: AgentTrajectoryStep[] = []
  let usedModuleTool = false
  let fallbackModuleCandidates: ModuleCandidate[] = []

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: options.systemPrompt },
    { role: "user", content: options.userPrompt },
  ]

  if (!client) {
    const fallbackQuery = deriveTitle(options.promptContent, options.narrationLocale)
    const toolResult = await searchPromptModules(fallbackQuery, options.narrationLocale)
    fallbackModuleCandidates = await fetchModuleCandidates(fallbackQuery)
    usedModuleTool = true

    pushTrajectoryStep(trajectory, "thought", options.missingClientThought)
    pushTrajectoryStep(
      trajectory,
      "action",
      localizeNarration(
        options.narrationLocale,
        `已根据提示词标题生成兜底查询，并执行 ${SEARCH_PROMPT_MODULES_TOOL}。`,
        `Executed ${SEARCH_PROMPT_MODULES_TOOL} with a fallback query derived from the prompt title.`
      ),
      SEARCH_PROMPT_MODULES_TOOL,
      { query: fallbackQuery, promptId: options.promptId },
      null
    )
    pushTrajectoryStep(
      trajectory,
      "observation",
      toolResult,
      null,
      null,
      buildToolObservationData(fallbackQuery, toolResult, fallbackModuleCandidates)
    )

    return {
      finalText: "",
      trajectory,
      usedModuleTool,
      fallbackModuleCandidates,
      termination: "missing_client",
    }
  }

  let iteration = 0

  while (iteration < MAX_REACT_ITERATIONS) {
    iteration += 1

    const toolChoice: ChatCompletionToolChoiceOption = usedModuleTool
      ? "auto"
      : { type: "function", function: { name: SEARCH_PROMPT_MODULES_TOOL } }

    const completion = await client.chat.completions.create({
      model: MINIMAX_MODEL,
      temperature: 0.2,
      messages,
      tools: AGENT_TOOLS,
      tool_choice: toolChoice,
    })

    const message = completion.choices[0]?.message
    if (!message) {
      break
    }

    const toolCalls = message.tool_calls ?? []
    if (toolCalls.length > 0) {
      const assistantMessage: ChatCompletionAssistantMessageParam = {
        role: "assistant",
        content: message.content ?? null,
        tool_calls: toolCalls,
      }
      messages.push(assistantMessage)

      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function" || toolCall.function.name !== SEARCH_PROMPT_MODULES_TOOL) {
          continue
        }

        const args = parseToolArguments(toolCall.function.arguments)
        const query = ensureString(
          args.query,
          deriveTitle(options.promptContent, options.narrationLocale)
        )
        usedModuleTool = true

        pushTrajectoryStep(
          trajectory,
          "action",
          localizeNarration(
            options.narrationLocale,
            `使用查询“${query}”请求可复用提示词模块。`,
            `Requested reusable prompt modules using the query "${query}".`
          ),
          SEARCH_PROMPT_MODULES_TOOL,
          { query, promptId: options.promptId, iteration },
          null
        )

        let toolResult: string
        try {
          toolResult = await searchPromptModules(query, options.narrationLocale)
          fallbackModuleCandidates = await fetchModuleCandidates(query)
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown module search failure."
          toolResult = localizeNarration(
            options.narrationLocale,
            `查询“${query}”的模块搜索失败：${message}`,
            `Module search failed for query "${query}": ${message}`
          )
        }

        pushTrajectoryStep(
          trajectory,
          "observation",
          toolResult,
          null,
          null,
          buildToolObservationData(query, toolResult, fallbackModuleCandidates)
        )

        const toolMessage: ChatCompletionToolMessageParam = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        }
        messages.push(toolMessage)
      }

      continue
    }

    return {
      finalText: stripCodeFences(extractMessageText(message.content)),
      trajectory,
      usedModuleTool,
      fallbackModuleCandidates,
      termination: "final",
    }
  }

  return {
    finalText: "",
    trajectory,
    usedModuleTool,
    fallbackModuleCandidates,
    termination: "iteration_limit",
  }
}

async function searchPromptModules(query: string, locale: NarrationLocale = "zh") {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return localizeNarration(locale, "模块搜索未提供查询词。", "No query was provided for module search.")
  }

  const modules = await prisma.module.findMany({
    where: {
      OR: [
        { title: { contains: trimmedQuery } },
        { content: { contains: trimmedQuery } },
        { tags: { contains: trimmedQuery } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_MODULE_RESULTS,
  })

  if (modules.length === 0) {
    return localizeNarration(
      locale,
      `没有任何提示词模块匹配查询“${trimmedQuery}”。`,
      `No prompt modules matched the query "${trimmedQuery}".`
    )
  }

  return modules
    .map((module, index) => {
      const tags = parseModuleTags(module.tags)
      return [
        localizeNarration(locale, `结果 ${index + 1}`, `Result ${index + 1}`),
        `ID: ${module.id}`,
        localizeNarration(locale, `标题：${module.title}`, `Title: ${module.title}`),
        localizeNarration(locale, `类型：${module.type}`, `Type: ${module.type}`),
        localizeNarration(
          locale,
          `标签：${tags.length > 0 ? tags.join(", ") : "无"}`,
          `Tags: ${tags.length > 0 ? tags.join(", ") : "none"}`
        ),
        localizeNarration(
          locale,
          `内容：${summarizeText(module.content, 320)}`,
          `Content: ${summarizeText(module.content, 320)}`
        ),
      ].join("\n")
    })
    .join("\n\n")
}

async function fetchModuleCandidates(query: string): Promise<ModuleCandidate[]> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  const modules = await prisma.module.findMany({
    where: {
      OR: [
        { title: { contains: trimmedQuery } },
        { content: { contains: trimmedQuery } },
        { tags: { contains: trimmedQuery } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
  })

  return modules.map((module) => ({
    type: module.type,
    content: summarizeText(module.content, 180),
  }))
}

function extractMessageText(content: string | null | undefined) {
  return typeof content === "string" ? content.trim() : ""
}

function parseToolArguments(rawArguments: string) {
  const parsed = safeJsonParse<Record<string, unknown>>(rawArguments, {})
  return isRecord(parsed) ? parsed : {}
}

function buildToolObservationData(query: string, toolResult: string, moduleCandidates: ModuleCandidate[]) {
  return {
    query,
    moduleCount: moduleCandidates.length,
    moduleCandidates,
    resultPreview: summarizeText(toolResult, 220),
  }
}

export async function evaluatePromptBenchmark(
  snapshot: PromptVersionSnapshot,
  promptId: string,
  versionNumber: number,
  locale?: string | null
): Promise<BenchmarkResult> {
  const narrationLocale = resolveNarrationLocale(
    locale,
    [snapshot.title, snapshot.description, snapshot.content, snapshot.notes].join("\n")
  )
  const client = createMiniMaxClient(MINIMAX_BENCHMARK_TIMEOUT_MS)
  const promptPayload = {
    promptId,
    versionNumber,
    title: snapshot.title,
    description: snapshot.description,
    content: snapshot.content,
    category: snapshot.category,
    model: snapshot.model,
    tags: snapshot.tags,
    notes: snapshot.notes,
    variables: snapshot.variables,
  }

  if (!client) {
    return normalizeBenchmarkResult(null, snapshot, narrationLocale)
  }

  const completion = await client.chat.completions.create({
    model: MINIMAX_MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: createBenchmarkSystemPrompt(narrationLocale) },
      {
        role: "user",
        content: [
          `Narration locale: ${narrationLocale}`,
          JSON.stringify(promptPayload, null, 2),
        ].join("\n\n"),
      },
    ],
  })

  const finalText = stripCodeFences(
    extractMessageText(completion.choices[0]?.message?.content ?? "")
  )
  const jsonCandidate = extractJsonCandidate(finalText)
  const parsed = safeJsonParse<unknown>(jsonCandidate ?? finalText, null)

  return normalizeBenchmarkResult(parsed, snapshot, narrationLocale)
}

export async function analyzePromptWithAgent(
  promptContent: string,
  promptId: string,
  locale?: string | null
): Promise<AgentRunResult> {
  const narrationLocale = resolveNarrationLocale(locale, promptContent)
  const loop = await runModuleAwareLoop({
    systemPrompt: createAgentSystemPrompt(narrationLocale),
    userPrompt: `Prompt ID: ${promptId}\nNarration locale: ${narrationLocale}\nPrompt Content:\n${promptContent}`,
    promptContent,
    promptId,
    missingClientThought:
      localizeNarration(
        narrationLocale,
        "MiniMax API key 不可用，因此 Agent 在进行本地模块检索后生成了一份平稳降级的分析结果。",
        "MiniMax API key is unavailable, so the agent produced a graceful fallback analysis after a local module lookup."
      ),
    narrationLocale,
    timeoutMs: MINIMAX_ANALYSIS_TIMEOUT_MS,
  })

  let analysis: AgentAnalysisResult

  if (loop.termination === "final") {
    const jsonCandidate = extractJsonCandidate(loop.finalText)
    const parsed = safeJsonParse<unknown>(jsonCandidate ?? loop.finalText, null)
    const sanitizedThought = sanitizeModelReasoning(loop.finalText)
    const finalThought =
      sanitizedThought ||
      localizeNarration(
        narrationLocale,
        "已在工具辅助推理后完成结构化分析。",
        "Finalized a structured analysis after tool-assisted reasoning."
      )

    analysis = normalizeAnalysis(
      parsed,
      promptContent,
      finalThought,
      loop.fallbackModuleCandidates,
      loop.usedModuleTool,
      narrationLocale
    )
  } else {
    const fallbackThought =
      loop.termination === "iteration_limit"
        ? localizeNarration(
            narrationLocale,
            "ReAct 循环在 MiniMax 返回最终 JSON 前达到了迭代上限，因此 Agent 输出了一份安全的降级分析。",
            "The ReAct loop hit the iteration limit before MiniMax returned final JSON, so the agent emitted a safe fallback analysis."
          )
        : localizeNarration(
            narrationLocale,
            "由于 MiniMax 未配置，Agent 在检查已保存模块后返回了一份降级分析结果。",
            "Returned a fallback analysis because MiniMax was not configured, while still checking saved modules."
          )

    analysis = createFallbackAnalysis(
      promptContent,
      fallbackThought,
      loop.fallbackModuleCandidates,
      loop.usedModuleTool,
      narrationLocale
    )
  }

  pushTrajectoryStep(
    loop.trajectory,
    "thought",
    localizeNarration(
      narrationLocale,
      `已完成分析，建议标题为“${analysis.suggestedTitle}”，风险等级为“${analysis.riskLevel}”。`,
      `Finalized analysis with suggested title "${analysis.suggestedTitle}" and risk "${analysis.riskLevel}".`
    )
  )

  return {
    analysis,
    trajectory: loop.trajectory,
    output: {
      result: analysis,
      meta: {
        engine: MINIMAX_MODEL,
        provider: "minimax",
        transport: "openai-compat",
        runType: "react_trajectory",
      },
    },
  }
}

export async function refactorPromptWithAgent(
  promptContent: string,
  promptId: string,
  locale?: string | null
): Promise<PromptRefactorRunResult> {
  const narrationLocale = resolveNarrationLocale(locale, promptContent)
  const loop = await runModuleAwareLoop({
    systemPrompt: createRefactorSystemPrompt(narrationLocale),
    userPrompt: [
      `Prompt ID: ${promptId}`,
      `Narration locale: ${narrationLocale}`,
      "Task: Refactor this saved prompt into a cleaner draft, reusable variables, and extracted modules.",
      "Prompt Content:",
      promptContent,
    ].join("\n"),
    promptContent,
    promptId,
    missingClientThought:
      localizeNarration(
        narrationLocale,
        "MiniMax API key 不可用，因此 Agent 在进行本地模块检索后生成了一份平稳降级的重构提案。",
        "MiniMax API key is unavailable, so the agent produced a graceful fallback refactor proposal after a local module lookup."
      ),
    narrationLocale,
    timeoutMs: MINIMAX_REFACTOR_TIMEOUT_MS,
  })

  let proposal: PromptRefactorResult

  if (loop.termination === "final") {
    const jsonCandidate = extractJsonCandidate(loop.finalText)
    const parsed = safeJsonParse<unknown>(jsonCandidate ?? loop.finalText, null)
    const sanitizedThought = sanitizeModelReasoning(loop.finalText)
    const finalThought =
      sanitizedThought ||
      localizeNarration(
        narrationLocale,
        "已在工具辅助推理后完成结构化重构提案。",
        "Finalized a structured refactor proposal after tool-assisted reasoning."
      )

    proposal = normalizeRefactorResult(
      parsed,
      promptContent,
      finalThought,
      loop.fallbackModuleCandidates,
      narrationLocale
    )
  } else {
    const fallbackThought =
      loop.termination === "iteration_limit"
        ? localizeNarration(
            narrationLocale,
            "ReAct 循环在 MiniMax 返回最终 JSON 前达到了迭代上限，因此 Agent 输出了一份安全的降级重构提案。",
            "The ReAct loop hit the iteration limit before MiniMax returned final JSON, so the agent emitted a safe fallback refactor proposal."
          )
        : localizeNarration(
            narrationLocale,
            "由于 MiniMax 未配置，Agent 在检查已保存模块后返回了一份降级重构提案。",
            "Returned a fallback refactor proposal because MiniMax was not configured, while still checking saved modules."
          )

    proposal = createFallbackRefactor(
      promptContent,
      fallbackThought,
      loop.fallbackModuleCandidates,
      narrationLocale
    )
  }

  pushTrajectoryStep(
    loop.trajectory,
    "thought",
    localizeNarration(
      narrationLocale,
      `已完成重构提案，生成了 ${proposal.extractedModules.length} 个可复用模块建议。`,
      `Finalized refactor proposal with ${proposal.extractedModules.length} reusable module suggestion(s).`
    )
  )

  return {
    proposal,
    trajectory: loop.trajectory,
    output: {
      result: proposal,
      meta: {
        engine: MINIMAX_MODEL,
        provider: "minimax",
        transport: "openai-compat",
        runType: "refactor_proposal",
      },
    },
  }
}
