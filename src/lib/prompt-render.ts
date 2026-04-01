const VAR_PATTERN = /\{\{(\w+)\}\}/g

export function extractPromptVariables(content: string) {
  const names = new Set<string>()

  for (const match of content.matchAll(VAR_PATTERN)) {
    names.add(match[1])
  }

  return Array.from(names)
}

export function renderPromptTemplate(
  content: string,
  values: Record<string, string>,
  fallback = (name: string) => `[${name}]`
) {
  return content.replace(VAR_PATTERN, (_, name: string) => values[name] ?? fallback(name))
}
