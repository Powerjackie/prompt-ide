"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getPrompts, getPromptsPaginated, type SerializedPrompt } from "@/app/actions/prompt-surface.actions"
import type { PromptFilterParams } from "@/app/actions/prompt-surface.actions"

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

export function usePromptsPaginated(pageSize: number = 24, filters?: PromptFilterParams) {
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const filtersKey = JSON.stringify(filters ?? {})
  const filtersRef = useRef(filtersKey)

  const fetchPage = useCallback(async (p: number, f?: PromptFilterParams) => {
    setLoading(true)
    const result = await getPromptsPaginated(p, pageSize, f)
    if (result.success) {
      setPrompts(result.data.prompts)
      setTotal(result.data.total)
      setPage(result.data.page)
    }
    setLoading(false)
  }, [pageSize])

  // Initial load + re-fetch when filters change
  useEffect(() => {
    let cancelled = false
    const parsedFilters = JSON.parse(filtersKey) as PromptFilterParams | undefined
    const filtersChanged = filtersRef.current !== filtersKey
    filtersRef.current = filtersKey

    const load = async () => {
      // Reset to page 1 when filters change
      const targetPage = filtersChanged ? 1 : page
      const result = await getPromptsPaginated(filtersChanged ? 1 : targetPage, pageSize, parsedFilters)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, filtersKey])

  const goToPage = useCallback((p: number) => {
    const parsedFilters = JSON.parse(filtersRef.current) as PromptFilterParams | undefined
    if (p >= 1 && p <= totalPages) void fetchPage(p, parsedFilters)
  }, [fetchPage, totalPages])

  return {
    prompts, loading, page, total, totalPages,
    goToPage,
    nextPage: useCallback(() => goToPage(page + 1), [goToPage, page]),
    prevPage: useCallback(() => goToPage(page - 1), [goToPage, page]),
    refetch: () => {
      const parsedFilters = JSON.parse(filtersRef.current) as PromptFilterParams | undefined
      return fetchPage(page, parsedFilters)
    },
  }
}
