"use client"

import { useMemo, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  cursorRef?: React.MutableRefObject<HTMLTextAreaElement | null>
  className?: string
}

const VAR_PATTERN = /\{\{(\w+)\}\}/g

export function PromptEditor({ value, onChange, cursorRef, className }: PromptEditorProps) {
  const t = useTranslations("editor")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineCount = useMemo(() => (value ? value.split(/\r?\n/).length : 0), [value])
  const characterCount = value.length
  const contentPlaceholder = String(t.raw("contentPlaceholder"))
  const canvasPlaceholderHint = String(t.raw("canvasPlaceholderHint"))

  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
      if (cursorRef) cursorRef.current = el
    },
    [cursorRef]
  )

  const handleFocus = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element || typeof window === "undefined") return
    if (!window.matchMedia("(max-width: 767px)").matches) return

    requestAnimationFrame(() => {
      element.scrollIntoView({ block: "center", behavior: "smooth" })
    })
  }, [])

  // Build highlighted overlay
  const highlighted = value.split(VAR_PATTERN).map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} className="rounded-sm bg-primary/16 text-transparent shadow-[0_0_0_1px_rgba(79,246,255,0.12)] dark:bg-primary/22 dark:shadow-[0_0_18px_-10px_rgba(79,246,255,0.7)]">
          {"{{" + part + "}}"}
        </span>
      )
    }
    return <span key={i} className="text-transparent">{part}</span>
  })

  return (
    <div className={cn("rounded-[1.75rem] border border-border/70 bg-muted/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.78),rgba(17,22,37,0.92))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_24px_58px_-36px_rgba(79,246,255,0.22)]", className)}>
      <div className="flex flex-col items-start gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-tight">{t("canvasTitle")}</p>
          <p className="text-xs text-muted-foreground">
            {t("canvasDescription")}
          </p>
        </div>
        <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground dark:border-primary/12 dark:bg-background/70">
          {t("canvasCharacters", { count: characterCount })}
        </div>
      </div>

      <div className="relative">
        {/* Highlight overlay */}
        <div
          className="absolute inset-0 pointer-events-none px-4 py-4 text-sm font-mono whitespace-pre-wrap break-words overflow-hidden"
          aria-hidden
        >
          {highlighted}
        </div>

        {/* Actual textarea */}
        <Textarea
          ref={setRefs}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={contentPlaceholder}
          className="relative z-10 min-h-[280px] resize-y border-0 bg-transparent px-4 py-4 font-mono text-sm leading-7 shadow-none focus-visible:ring-0 sm:min-h-[420px] dark:text-slate-100 dark:caret-primary"
          onFocus={(event) => handleFocus(event.currentTarget)}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col items-start gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 dark:border-primary/12 dark:bg-background/65">
              {t("canvasLines", { count: lineCount })}
            </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 dark:border-primary/12 dark:bg-background/65">
            {t("canvasPlaceholdersEnabled")}
          </span>
        </div>
        <span className="break-words text-left sm:text-right">{canvasPlaceholderHint}</span>
      </div>
    </div>
  )
}

/** Extract variable names from prompt content */
export function extractVariables(content: string): string[] {
  const matches = content.matchAll(VAR_PATTERN)
  const names = new Set<string>()
  for (const m of matches) names.add(m[1])
  return Array.from(names)
}
