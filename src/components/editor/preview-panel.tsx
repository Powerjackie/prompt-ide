"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Badge } from "@/components/ui/badge"
import { extractPromptVariables, renderPromptTemplate } from "@/lib/prompt-render"
import { cn } from "@/lib/utils"

type PreviewMode = "rendered" | "raw"

interface PreviewPanelProps {
  content: string
  variables: { name: string; defaultValue: string }[]
}

export function PreviewPanel({ content, variables }: PreviewPanelProps) {
  const t = useTranslations("editor")
  const [mode, setMode] = useState<PreviewMode>("rendered")

  const rendered = useMemo(() => {
    return renderPromptTemplate(
      content,
      Object.fromEntries(variables.map((variable) => [variable.name, variable.defaultValue || `[${variable.name}]`])),
      (name) => `[${name}]`
    )
  }, [content, variables])

  const varNames = useMemo(() => {
    return extractPromptVariables(content)
  }, [content])

  if (!content) {
    return (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/15 px-6 py-12 text-center dark:border-primary/12">
        <div className="mb-3 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground dark:border-primary/12 dark:bg-background/70">
          {t("previewLiveTitle")}
        </div>
        <p className="text-base font-semibold tracking-tight">{t("previewEmptyTitle")}</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {t("previewEmptyDescription")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2 dark:border-primary/12 dark:bg-background/60">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("previewStats.characters")}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{content.length}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2 dark:border-primary/12 dark:bg-background/60">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("previewStats.words")}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">~{Math.ceil(content.split(/\s+/).filter(Boolean).length)}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2 dark:border-primary/12 dark:bg-background/60">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("previewStats.variables")}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{varNames.length}</p>
        </div>
      </div>

      {varNames.length > 0 && (
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/15 p-3 dark:border-primary/12 dark:bg-background/58">
          <span className="mb-2 block text-xs font-medium text-muted-foreground">{t("previewVariablesTitle")}</span>
          <div className="flex flex-wrap gap-1.5">
          {varNames.map((v) => (
            <Badge key={v} variant="outline" className="rounded-full text-[10px] font-mono dark:border-primary/18 dark:bg-background/60">
              {`{{${v}}}`}
            </Badge>
          ))}
          </div>
        </div>
      )}

      <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4 dark:border-primary/12">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">{t("previewRenderedTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("previewRenderedDescription")}
            </p>
          </div>
          <div
            role="tablist"
            aria-label={t("previewModeBadge")}
            className="inline-flex items-center gap-0 rounded-full border border-border/70 bg-background/80 p-0.5 text-[11px] font-medium dark:border-primary/12 dark:bg-background/70"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "rendered"}
              onClick={() => setMode("rendered")}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                mode === "rendered"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("previewModeRendered")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "raw"}
              onClick={() => setMode("raw")}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                mode === "raw"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("previewModeRaw")}
            </button>
          </div>
        </div>
        {mode === "rendered" ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{rendered}</ReactMarkdown>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm leading-7">{rendered}</pre>
        )}
      </div>
    </div>
  )
}
