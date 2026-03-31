import type { Variable } from "@/types/prompt"

const VAR_PATTERN = /\{\{(\w+)\}\}/g

export function extractVariables(content: string): Variable[] {
  const names = new Set<string>()
  for (const m of content.matchAll(VAR_PATTERN)) names.add(m[1])
  return Array.from(names).map((name) => ({
    name,
    description: "",
    defaultValue: "",
  }))
}
