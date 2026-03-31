"use client"

import { useState, useEffect, useCallback } from "react"
import { getModules } from "@/app/actions/module.actions"
import type { SerializedModule } from "@/app/actions/module.actions"

export function useModules() {
  const [modules, setModules] = useState<SerializedModule[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const result = await getModules()
    if (result.success) setModules(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadModules = async () => {
      const result = await getModules()
      if (cancelled) return

      if (result.success) setModules(result.data)
      setLoading(false)
    }

    void loadModules()

    return () => {
      cancelled = true
    }
  }, [])

  return { modules, loading, refetch }
}
