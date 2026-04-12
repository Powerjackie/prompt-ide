"use client"

import { useState, useEffect, useCallback } from "react"
import { getPrompts, getPromptsPaginated, type SerializedPrompt } from "@/app/actions/prompt-surface.actions"

/**
 * Client-side hook to fetch prompts from the database via server actions.
 * Returns { prompts, loading, refetch }.
 */
export function usePrompts() {
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const result = await getPrompts()
    if (result.success) {
      setPrompts(result.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadPrompts = async () => {
      const result = await getPrompts()
      if (cancelled) return

      if (result.success) {
        setPrompts(result.data)
      }
      setLoading(false)
    }

    void loadPrompts()

    return () => {
      cancelled = true
    }
  }, [])

  return { prompts, loading, refetch }
}

export function usePromptsPaginated(pageSize: number = 24) {
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true)
    const result = await getPromptsPaginated(p, pageSize)
    if (result.success) {
      setPrompts(result.data.prompts)
      setTotal(result.data.total)
      setPage(result.data.page)
    }
    setLoading(false)
  }, [pageSize])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const result = await getPromptsPaginated(1, pageSize)
      if (cancelled) return
      if (result.success) {
        setPrompts(result.data.prompts)
        setTotal(result.data.total)
        setPage(result.data.page)
      }
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [pageSize])

  const goToPage = useCallback((p: number) => {
    if (p >= 1 && p <= totalPages) void fetchPage(p)
  }, [fetchPage, totalPages])

  return {
    prompts, loading, page, total, totalPages,
    goToPage,
    nextPage: useCallback(() => goToPage(page + 1), [goToPage, page]),
    prevPage: useCallback(() => goToPage(page - 1), [goToPage, page]),
    refetch: () => fetchPage(page),
  }
}
