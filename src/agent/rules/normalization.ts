export function normalize(content: string): string | null {
  let result = content

  // Trim leading/trailing whitespace
  result = result.trim()

  // Collapse multiple blank lines into one
  result = result.replace(/\n{3,}/g, "\n\n")

  // Remove trailing spaces on lines
  result = result.replace(/[ \t]+\n/g, "\n")

  // Collapse multiple spaces (except leading indentation)
  result = result.replace(/([^\n]) {2,}/g, "$1 ")

  if (result === content) return null
  return result
}

export function generateTitle(content: string): string {
  // Take first meaningful line
  const lines = content.split("\n").filter((l) => l.trim().length > 0)
  if (lines.length === 0) return "Untitled"

  let title = lines[0].trim()
  // Remove common prefixes
  title = title.replace(/^(#+ |[*-] |>\s*|\d+\.\s*)/, "")
  // Truncate
  if (title.length > 60) title = title.slice(0, 57) + "..."
  return title || "Untitled"
}

export function generateDescription(content: string): string {
  const lines = content.split("\n").filter((l) => l.trim().length > 0)
  if (lines.length <= 1) return ""
  // Use first 2-3 lines, max 150 chars
  const desc = lines.slice(0, 3).join(" ").trim()
  if (desc.length > 150) return desc.slice(0, 147) + "..."
  return desc
}
