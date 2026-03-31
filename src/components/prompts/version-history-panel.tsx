"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { History, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getPromptVersionsByPromptId,
  restorePromptVersion,
} from "@/app/actions/prompt-version.actions"
import { cn, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { PromptVersion, PromptVersionSnapshot } from "@/types/prompt-version"
import type { SerializedPrompt } from "@/app/actions/prompt.actions"

interface VersionHistoryPanelProps {
  promptId: string
  currentSnapshot: PromptVersionSnapshot
  onRestore?: (prompt: SerializedPrompt) => void
  refreshKey?: string | number
}

const FIELD_LABEL_KEYS: Record<keyof PromptVersionSnapshot, string> = {
  title: "title",
  description: "description",
  content: "content",
  status: "status",
  source: "source",
  model: "model",
  category: "category",
  tags: "tags",
  notes: "notes",
  variables: "variables",
}

function normalizeValue(value: PromptVersionSnapshot[keyof PromptVersionSnapshot]) {
  if (Array.isArray(value)) {
    return JSON.stringify(value, null, 2)
  }

  return value || "-"
}

export function VersionHistoryPanel({
  promptId,
  currentSnapshot,
  onRestore,
  refreshKey,
}: VersionHistoryPanelProps) {
  const t = useTranslations("prompts.versions")
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false

    async function loadVersions() {
      setLoading(true)
      const result = await getPromptVersionsByPromptId(promptId)
      if (cancelled) return

      if (result.success) {
        setVersions(result.data)
        setSelectedVersionId((current) => current ?? result.data[0]?.id ?? null)
      } else {
        toast.error(result.error)
      }

      setLoading(false)
    }

    void loadVersions()

    return () => {
      cancelled = true
    }
  }, [promptId, refreshKey])

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? versions[0] ?? null,
    [selectedVersionId, versions]
  )

  const diffEntries = useMemo(() => {
    if (!selectedVersion) return []

    return (Object.keys(FIELD_LABEL_KEYS) as (keyof PromptVersionSnapshot)[])
      .filter((field) => {
        return JSON.stringify(currentSnapshot[field]) !== JSON.stringify(selectedVersion[field])
      })
      .map((field) => ({
        field,
        currentValue: normalizeValue(currentSnapshot[field]),
        versionValue: normalizeValue(selectedVersion[field]),
      }))
  }, [currentSnapshot, selectedVersion])

  const handleRestore = (version: PromptVersion) => {
    startTransition(async () => {
      const result = await restorePromptVersion(promptId, version.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      const refetch = await getPromptVersionsByPromptId(promptId)
      if (refetch.success) {
        setVersions(refetch.data)
        setSelectedVersionId(refetch.data[0]?.id ?? null)
      }

      onRestore?.(result.data.prompt)
      toast.success(t("restored"))
    })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>{t("loading")}</span>
      </div>
    )
  }

  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="font-medium">{t("title")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Badge variant="secondary">{t("count", { count: versions.length })}</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {versions.map((version, index) => (
            <button
              key={version.id}
              type="button"
              onClick={() => setSelectedVersionId(version.id)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40",
                selectedVersion?.id === version.id && "border-primary bg-accent/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {t("versionLabel", { version: version.versionNumber })}
                </span>
                {index === 0 && <Badge variant="outline">{t("latest")}</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{version.changeSummary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("savedAt", { date: formatDate(version.createdAt) })}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-lg border p-4">
          {selectedVersion ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium">
                    {t("compareTitle", { version: selectedVersion.versionNumber })}
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedVersion.changeSummary}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestore(selectedVersion)}
                  disabled={pending}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  {pending ? t("restoring") : t("restoreAction")}
                </Button>
              </div>

              {diffEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noDiff")}</p>
              ) : (
                <div className="space-y-3">
                  {diffEntries.map((entry) => (
                    <div key={entry.field} className="rounded-md border bg-muted/20 p-3">
                      <div className="mb-2 text-sm font-medium">
                        {t(`fields.${FIELD_LABEL_KEYS[entry.field]}`)}
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div>
                          <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            {t("current")}
                          </div>
                          <pre className="whitespace-pre-wrap rounded-md bg-background p-3 text-xs">
                            {entry.currentValue}
                          </pre>
                        </div>
                        <div>
                          <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            {t("selected")}
                          </div>
                          <pre className="whitespace-pre-wrap rounded-md bg-background p-3 text-xs">
                            {entry.versionValue}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
