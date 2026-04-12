"use client"

import { useState } from "react"
import type { ModelType, PromptStatus } from "@/types/prompt"

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

export function usePromptFilters() {
  const [filters, setFilters] = useState<PromptFilters>(defaultFilters)

  const updateFilter = <K extends keyof PromptFilters>(key: K, value: PromptFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const resetFilters = () => setFilters(defaultFilters)

  return { filters, updateFilter, resetFilters }
}
