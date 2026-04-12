export const APP_THEME_VALUES = ["light", "dark", "system"] as const
export const APP_DEFAULT_VIEW_VALUES = ["card", "list"] as const
export const APP_DEFAULT_STATUS_VALUES = ["inbox", "production", "archived"] as const
export const APP_DEFAULT_MODEL_VALUES = [
  "universal",
  "claude",
  "gpt4",
  "gemini",
  "deepseek",
] as const
export const AGENT_RISK_THRESHOLD_VALUES = ["low", "medium", "high"] as const
export const AGENT_PROVIDER_VALUES = [
  "mock",
  "openai",
  "claude",
  "gemini",
  "minimax",
  "zhipu",
] as const
export const AGENT_ANALYSIS_DEPTH_VALUES = ["quick", "standard", "deep"] as const

export type AppTheme = (typeof APP_THEME_VALUES)[number]
export type AppDefaultView = (typeof APP_DEFAULT_VIEW_VALUES)[number]
export type AppDefaultStatus = (typeof APP_DEFAULT_STATUS_VALUES)[number]
export type AppDefaultModel = (typeof APP_DEFAULT_MODEL_VALUES)[number]
export type AgentRiskThreshold = (typeof AGENT_RISK_THRESHOLD_VALUES)[number]
export type AgentProvider = (typeof AGENT_PROVIDER_VALUES)[number]
export type AgentAnalysisDepth = (typeof AGENT_ANALYSIS_DEPTH_VALUES)[number]

export interface AgentSettings {
  enabled: boolean
  autoAnalyze: boolean
  confidenceThreshold: number
  similarityThreshold: number
  riskThreshold: AgentRiskThreshold
  enableNormalization: boolean
  enableModuleExtraction: boolean
  analyzeOnPaste: boolean
  provider: AgentProvider
  analysisDepth: AgentAnalysisDepth
}

export interface AppSettings {
  theme: AppTheme
  sidebarCollapsed: boolean
  defaultView: AppDefaultView
  defaultModel: AppDefaultModel
  defaultStatus: AppDefaultStatus
  agent: AgentSettings
}

export interface AdminDiagnostics {
  role: "admin"
  settingsKey: string
  settingsRowExists: boolean
  settingsSource: "persisted" | "default-fallback"
  database: {
    provider: "sqlite"
    targetHint: string
    targetMode: "file-based sqlite"
  }
  effectiveSummary: {
    defaultView: AppDefaultView
    defaultModel: AppDefaultModel
    defaultStatus: AppDefaultStatus
    agentEnabled: boolean
    agentProvider: AgentProvider
    analysisDepth: AgentAnalysisDepth
  }
  guardrails: {
    ensureAdminWriteGuard: true
    settingsRouteAbsent: true
    adminRouteOnly: true
  }
}
