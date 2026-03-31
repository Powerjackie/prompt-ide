import type { PromptVersionSnapshot } from "@/types/prompt-version"
import type { Variable } from "@/types/prompt"

type PromptSnapshotRow = {
  title: string
  description: string
  content: string
  status: string
  source: string
  model: string
  category: string
  tags: string
  notes: string
  variables: string
}

export function deserializePromptSnapshot(row: PromptSnapshotRow): PromptVersionSnapshot {
  return {
    title: row.title,
    description: row.description,
    content: row.content,
    status: row.status as PromptVersionSnapshot["status"],
    source: row.source,
    model: row.model as PromptVersionSnapshot["model"],
    category: row.category,
    tags: JSON.parse(row.tags) as string[],
    notes: row.notes,
    variables: JSON.parse(row.variables) as Variable[],
  }
}

export function serializePromptSnapshot(snapshot: PromptVersionSnapshot) {
  return {
    title: snapshot.title,
    description: snapshot.description,
    content: snapshot.content,
    status: snapshot.status,
    source: snapshot.source,
    model: snapshot.model,
    category: snapshot.category,
    tags: JSON.stringify(snapshot.tags),
    notes: snapshot.notes,
    variables: JSON.stringify(snapshot.variables),
  }
}

export function buildChangeSummary(changedFields: string[]) {
  if (changedFields.length === 0) return "Updated prompt"
  return `Updated ${changedFields.join(", ")}`
}
