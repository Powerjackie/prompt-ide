import type { ModelType, PromptStatus } from "@/types/prompt"
import type { ModuleType } from "@/types/module"

export const MODEL_OPTIONS: { value: ModelType; label: string }[] = [
  { value: "universal", label: "Universal" },
  { value: "claude", label: "Claude" },
  { value: "gpt4", label: "GPT" },
  { value: "gemini", label: "Gemini" },
  { value: "deepseek", label: "DeepSeek" },
]

export const STATUS_OPTIONS: { value: PromptStatus; label: string; color: string }[] = [
  { value: "inbox", label: "Inbox", color: "bg-yellow-500" },
  { value: "production", label: "Production", color: "bg-green-500" },
  { value: "archived", label: "Archived", color: "bg-gray-500" },
]

export const MODULE_TYPES: { value: ModuleType; label: string }[] = [
  { value: "role", label: "Role" },
  { value: "goal", label: "Goal" },
  { value: "constraint", label: "Constraint" },
  { value: "output_format", label: "Output Format" },
  { value: "style", label: "Style" },
  { value: "self_check", label: "Self Check" },
]

export const CATEGORY_OPTIONS = [
  "code",
  "writing",
  "data",
  "marketing",
  "education",
  "design",
  "research",
  "productivity",
  "communication",
  "general",
]

export const RISK_COLORS = {
  low: "text-green-600 bg-green-50 dark:bg-green-950",
  medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950",
  high: "text-red-600 bg-red-50 dark:bg-red-950",
} as const
