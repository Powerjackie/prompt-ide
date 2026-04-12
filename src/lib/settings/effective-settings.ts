import { ensureAuthenticated } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import {
  AGENT_ANALYSIS_DEPTH_VALUES,
  AGENT_PROVIDER_VALUES,
  AGENT_RISK_THRESHOLD_VALUES,
  APP_DEFAULT_MODEL_VALUES,
  APP_DEFAULT_STATUS_VALUES,
  APP_DEFAULT_VIEW_VALUES,
  APP_THEME_VALUES,
  type AppSettings,
} from "@/types/settings"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

const SETTINGS_KEY = "app-settings"

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  sidebarCollapsed: false,
  defaultView: "card",
  defaultModel: "universal",
  defaultStatus: "inbox",
  agent: {
    enabled: true,
    autoAnalyze: true,
    confidenceThreshold: 0.7,
    similarityThreshold: 0.3,
    riskThreshold: "medium",
    enableNormalization: false,
    enableModuleExtraction: true,
    analyzeOnPaste: true,
    provider: "minimax",
    analysisDepth: "standard",
  },
}

function isOneOf<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value as T[number])
}

function ensureThreshold(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1) {
    return fallback
  }
  return value
}

function assertThreshold(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1) {
    throw new Error(`${field} is invalid`)
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sanitizeSettingsPayload(data: Partial<AppSettings>): Partial<AppSettings> {
  const sanitized: Partial<AppSettings> = {}

  if (data.sidebarCollapsed !== undefined && typeof data.sidebarCollapsed === "boolean") {
    sanitized.sidebarCollapsed = data.sidebarCollapsed
  }

  if (data.theme !== undefined && isOneOf(data.theme, APP_THEME_VALUES)) {
    sanitized.theme = data.theme
  }

  if (data.defaultView !== undefined && isOneOf(data.defaultView, APP_DEFAULT_VIEW_VALUES)) {
    sanitized.defaultView = data.defaultView
  }

  if (data.defaultModel !== undefined && isOneOf(data.defaultModel, APP_DEFAULT_MODEL_VALUES)) {
    sanitized.defaultModel = data.defaultModel
  }

  if (data.defaultStatus !== undefined && isOneOf(data.defaultStatus, APP_DEFAULT_STATUS_VALUES)) {
    sanitized.defaultStatus = data.defaultStatus
  }

  return sanitized
}

function sanitizeAgentPayload(
  data: Partial<AppSettings["agent"]>
): Partial<AppSettings["agent"]> {
  const sanitized: Partial<AppSettings["agent"]> = {}

  if (data.enabled !== undefined && typeof data.enabled === "boolean") {
    sanitized.enabled = data.enabled
  }

  if (data.autoAnalyze !== undefined && typeof data.autoAnalyze === "boolean") {
    sanitized.autoAnalyze = data.autoAnalyze
  }

  if (data.analyzeOnPaste !== undefined && typeof data.analyzeOnPaste === "boolean") {
    sanitized.analyzeOnPaste = data.analyzeOnPaste
  }

  if (data.enableNormalization !== undefined && typeof data.enableNormalization === "boolean") {
    sanitized.enableNormalization = data.enableNormalization
  }

  if (data.enableModuleExtraction !== undefined && typeof data.enableModuleExtraction === "boolean") {
    sanitized.enableModuleExtraction = data.enableModuleExtraction
  }

  if (data.provider !== undefined && isOneOf(data.provider, AGENT_PROVIDER_VALUES)) {
    sanitized.provider = data.provider
  }

  if (data.analysisDepth !== undefined && isOneOf(data.analysisDepth, AGENT_ANALYSIS_DEPTH_VALUES)) {
    sanitized.analysisDepth = data.analysisDepth
  }

  if (data.riskThreshold !== undefined && isOneOf(data.riskThreshold, AGENT_RISK_THRESHOLD_VALUES)) {
    sanitized.riskThreshold = data.riskThreshold
  }

  if (data.confidenceThreshold !== undefined) {
    sanitized.confidenceThreshold = ensureThreshold(
      data.confidenceThreshold,
      DEFAULT_SETTINGS.agent.confidenceThreshold
    )
  }

  if (data.similarityThreshold !== undefined) {
    sanitized.similarityThreshold = ensureThreshold(
      data.similarityThreshold,
      DEFAULT_SETTINGS.agent.similarityThreshold
    )
  }

  return sanitized
}

export function mergeSettingsWithDefaults(data?: Partial<AppSettings> | null): AppSettings {
  const sanitized = data ? sanitizeSettingsPayload(data) : {}
  const agentSanitized = data?.agent ? sanitizeAgentPayload(data.agent) : {}

  return {
    ...DEFAULT_SETTINGS,
    ...sanitized,
    agent: {
      ...DEFAULT_SETTINGS.agent,
      ...agentSanitized,
    },
  }
}

export function getDefaultSettings(): AppSettings {
  return mergeSettingsWithDefaults()
}

export function sanitizeSettingsPatch(data: Partial<AppSettings>): Partial<AppSettings> {
  const sanitized: Partial<AppSettings> = {}

  if (data.sidebarCollapsed !== undefined) {
    if (typeof data.sidebarCollapsed !== "boolean") {
      throw new Error("sidebarCollapsed is invalid")
    }
    sanitized.sidebarCollapsed = data.sidebarCollapsed
  }

  if (data.theme !== undefined) {
    if (!isOneOf(data.theme, APP_THEME_VALUES)) {
      throw new Error("theme is invalid")
    }
    sanitized.theme = data.theme
  }

  if (data.defaultView !== undefined) {
    if (!isOneOf(data.defaultView, APP_DEFAULT_VIEW_VALUES)) {
      throw new Error("defaultView is invalid")
    }
    sanitized.defaultView = data.defaultView
  }

  if (data.defaultModel !== undefined) {
    if (!isOneOf(data.defaultModel, APP_DEFAULT_MODEL_VALUES)) {
      throw new Error("defaultModel is invalid")
    }
    sanitized.defaultModel = data.defaultModel
  }

  if (data.defaultStatus !== undefined) {
    if (!isOneOf(data.defaultStatus, APP_DEFAULT_STATUS_VALUES)) {
      throw new Error("defaultStatus is invalid")
    }
    sanitized.defaultStatus = data.defaultStatus
  }

  return sanitized
}

export function sanitizeImportedSettings(data: unknown): AppSettings {
  if (!isRecord(data)) {
    throw new Error("Settings JSON must be an object")
  }

  const theme = String(data.theme ?? "")
  if (!isOneOf(theme, APP_THEME_VALUES)) {
    throw new Error("theme is invalid")
  }

  if (typeof data.sidebarCollapsed !== "boolean") {
    throw new Error("sidebarCollapsed is invalid")
  }

  const defaultView = String(data.defaultView ?? "")
  if (!isOneOf(defaultView, APP_DEFAULT_VIEW_VALUES)) {
    throw new Error("defaultView is invalid")
  }

  const defaultModel = String(data.defaultModel ?? "")
  if (!isOneOf(defaultModel, APP_DEFAULT_MODEL_VALUES)) {
    throw new Error("defaultModel is invalid")
  }

  const defaultStatus = String(data.defaultStatus ?? "")
  if (!isOneOf(defaultStatus, APP_DEFAULT_STATUS_VALUES)) {
    throw new Error("defaultStatus is invalid")
  }

  if (!isRecord(data.agent)) {
    throw new Error("agent is invalid")
  }

  const agent = data.agent

  if (typeof agent.enabled !== "boolean") {
    throw new Error("agent.enabled is invalid")
  }

  if (typeof agent.autoAnalyze !== "boolean") {
    throw new Error("agent.autoAnalyze is invalid")
  }

  if (typeof agent.analyzeOnPaste !== "boolean") {
    throw new Error("agent.analyzeOnPaste is invalid")
  }

  if (typeof agent.enableNormalization !== "boolean") {
    throw new Error("agent.enableNormalization is invalid")
  }

  if (typeof agent.enableModuleExtraction !== "boolean") {
    throw new Error("agent.enableModuleExtraction is invalid")
  }

  const provider = String(agent.provider ?? "")
  if (!isOneOf(provider, AGENT_PROVIDER_VALUES)) {
    throw new Error("agent.provider is invalid")
  }

  const analysisDepth = String(agent.analysisDepth ?? "")
  if (!isOneOf(analysisDepth, AGENT_ANALYSIS_DEPTH_VALUES)) {
    throw new Error("agent.analysisDepth is invalid")
  }

  const riskThreshold = String(agent.riskThreshold ?? "")
  if (!isOneOf(riskThreshold, AGENT_RISK_THRESHOLD_VALUES)) {
    throw new Error("agent.riskThreshold is invalid")
  }

  return {
    theme,
    sidebarCollapsed: data.sidebarCollapsed,
    defaultView,
    defaultModel,
    defaultStatus,
    agent: {
      enabled: agent.enabled,
      autoAnalyze: agent.autoAnalyze,
      analyzeOnPaste: agent.analyzeOnPaste,
      enableNormalization: agent.enableNormalization,
      enableModuleExtraction: agent.enableModuleExtraction,
      provider,
      analysisDepth,
      riskThreshold,
      confidenceThreshold: assertThreshold(
        agent.confidenceThreshold,
        "agent.confidenceThreshold"
      ),
      similarityThreshold: assertThreshold(
        agent.similarityThreshold,
        "agent.similarityThreshold"
      ),
    },
  }
}

export function sanitizeAgentSettingsPatch(
  data: Partial<AppSettings["agent"]>
): Partial<AppSettings["agent"]> {
  const sanitized: Partial<AppSettings["agent"]> = {}

  if (data.enabled !== undefined) {
    if (typeof data.enabled !== "boolean") {
      throw new Error("enabled is invalid")
    }
    sanitized.enabled = data.enabled
  }

  if (data.autoAnalyze !== undefined) {
    if (typeof data.autoAnalyze !== "boolean") {
      throw new Error("autoAnalyze is invalid")
    }
    sanitized.autoAnalyze = data.autoAnalyze
  }

  if (data.analyzeOnPaste !== undefined) {
    if (typeof data.analyzeOnPaste !== "boolean") {
      throw new Error("analyzeOnPaste is invalid")
    }
    sanitized.analyzeOnPaste = data.analyzeOnPaste
  }

  if (data.enableNormalization !== undefined) {
    if (typeof data.enableNormalization !== "boolean") {
      throw new Error("enableNormalization is invalid")
    }
    sanitized.enableNormalization = data.enableNormalization
  }

  if (data.enableModuleExtraction !== undefined) {
    if (typeof data.enableModuleExtraction !== "boolean") {
      throw new Error("enableModuleExtraction is invalid")
    }
    sanitized.enableModuleExtraction = data.enableModuleExtraction
  }

  if (data.provider !== undefined) {
    if (!isOneOf(data.provider, AGENT_PROVIDER_VALUES)) {
      throw new Error("provider is invalid")
    }
    sanitized.provider = data.provider
  }

  if (data.analysisDepth !== undefined) {
    if (!isOneOf(data.analysisDepth, AGENT_ANALYSIS_DEPTH_VALUES)) {
      throw new Error("analysisDepth is invalid")
    }
    sanitized.analysisDepth = data.analysisDepth
  }

  if (data.riskThreshold !== undefined) {
    if (!isOneOf(data.riskThreshold, AGENT_RISK_THRESHOLD_VALUES)) {
      throw new Error("riskThreshold is invalid")
    }
    sanitized.riskThreshold = data.riskThreshold
  }

  if (data.confidenceThreshold !== undefined) {
    sanitized.confidenceThreshold = ensureThreshold(
      data.confidenceThreshold,
      DEFAULT_SETTINGS.agent.confidenceThreshold
    )
  }

  if (data.similarityThreshold !== undefined) {
    sanitized.similarityThreshold = ensureThreshold(
      data.similarityThreshold,
      DEFAULT_SETTINGS.agent.similarityThreshold
    )
  }

  return sanitized
}

export async function getEffectiveSettings(): Promise<ActionResult<AppSettings>> {
  if (!(await ensureAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } })
    if (!row) return { success: true, data: getDefaultSettings() }
    const parsed = JSON.parse(row.value) as Partial<AppSettings>
    return { success: true, data: mergeSettingsWithDefaults(parsed) }
  } catch {
    return { success: true, data: getDefaultSettings() }
  }
}
