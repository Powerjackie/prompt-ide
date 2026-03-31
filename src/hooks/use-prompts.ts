"use client"

import { useState, useEffect, useCallback } from "react"
import { getPrompts, type SerializedPrompt } from "@/app/actions/prompt.actions"

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
