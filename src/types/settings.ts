export interface AgentSettings {
  enabled: boolean
  autoAnalyze: boolean
  confidenceThreshold: number
  similarityThreshold: number
  riskThreshold: "low" | "medium" | "high"
  enableNormalization: boolean
  enableModuleExtraction: boolean
  analyzeOnPaste: boolean
  provider: "mock" | "openai" | "claude" | "gemini" | "minimax" | "zhipu"
  analysisDepth: "quick" | "standard" | "deep"
}

export interface AppSettings {
  theme: "light" | "dark" | "system"
  sidebarCollapsed: boolean
  defaultView: "card" | "list"
  defaultModel: string
  defaultStatus: string
  agent: AgentSettings
}
