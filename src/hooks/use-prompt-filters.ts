"use client"

import { useMemo, useState } from "react"
import type { Prompt, ModelType, PromptStatus } from "@/types/prompt"

export interface PromptFilters {
  search: string
  status: PromptStatus | "all"
  model: ModelType | "all"
  tag: string | "all"
  sort: "updated" | "created" | "title" | "lastUsed"
}

const defaultFilters: PromptFilters = {
  search: "",
  status: "all",
  model: "all",
  tag: "all",
  sort: "updated",
}

export function usePromptFilters(prompts: Prompt[]) {
  const [filters, setFilters] = useState<PromptFilters>(defaultFilters)

  const filtered = useMemo(() => {
    let result = [...prompts]

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Status
    if (filters.status !== "all") {
      result = result.filter((p) => p.status === filters.status)
    }

    // Model
    if (filters.model !== "all") {
      result = result.filter((p) => p.model === filters.model)
    }

    // Tag
    if (filters.tag !== "all") {
      result = result.filter((p) => p.tags.includes(filters.tag))
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case "updated":
          return b.updatedAt.localeCompare(a.updatedAt)
        case "created":
          return b.createdAt.localeCompare(a.createdAt)
        case "title":
          return a.title.localeCompare(b.title)
        case "lastUsed":
          return (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "")
        default:
          return 0
      }
    })

    return result
  }, [prompts, filters])

  const updateFilter = <K extends keyof PromptFilters>(key: K, value: PromptFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const resetFilters = () => setFilters(defaultFilters)

  return { filters, filtered, updateFilter, resetFilters }
}
