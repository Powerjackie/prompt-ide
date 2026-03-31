import type { DuplicateCandidate } from "@/types/agent"

function trigrams(text: string): Set<string> {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim()
  const set = new Set<string>()
  for (let i = 0; i <= clean.length - 3; i++) {
    set.add(clean.slice(i, i + 3))
  }
  return set
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let intersection = 0
  for (const item of a) {
    if (b.has(item)) intersection++
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

export function findDuplicates(
  content: string,
  candidates: { id: string; title: string; content: string }[],
  threshold: number
): DuplicateCandidate[] {
  const inputTrigrams = trigrams(content)
  const results: DuplicateCandidate[] = []

  for (const candidate of candidates) {
    const candidateTrigrams = trigrams(candidate.content)
    const similarity = jaccardSimilarity(inputTrigrams, candidateTrigrams)
    if (similarity >= threshold) {
      results.push({
        id: candidate.id,
        title: candidate.title,
        similarity: Math.round(similarity * 100) / 100,
      })
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity)
}
