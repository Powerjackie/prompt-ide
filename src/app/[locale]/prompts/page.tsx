"use client"

import { useState, useMemo, useTransition, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { FileText, Plus, Star, Copy, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/navigation"
import { usePrompts } from "@/hooks/use-prompts"
import { toggleFavorite, markPromptLastUsed } from "@/app/actions/prompt.actions"
import { usePromptFilters } from "@/hooks/use-prompt-filters"
import { PromptCard } from "@/components/prompts/prompt-card"
import { PromptFiltersBar } from "@/components/prompts/prompt-filters"
import { formatDate, cn, copyToClipboard } from "@/lib/utils"
import { MODEL_OPTIONS, STATUS_OPTIONS } from "@/lib/constants"
import { toast } from "sonner"

export default function PromptsPage() {
  return (
    <Suspense>
      <PromptsContent />
    </Suspense>
  )
}

function PromptsContent() {
  const t = useTranslations("prompts")
  const tc = useTranslations("common")
  const { prompts: allPrompts, loading } = usePrompts()
  const [, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const [view, setView] = useState<"card" | "list">("card")

  const prompts = useMemo(
    () => allPrompts.filter((p) => p.status !== "archived"),
    [allPrompts]
  )

  const { filters, filtered, updateFilter, resetFilters } = usePromptFilters(prompts)

  const tagParam = searchParams.get("tag")
  useMemo(() => {
    if (tagParam && filters.tag === "all") {
      updateFilter("tag", tagParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagParam])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    prompts.forEach((p) => p.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [prompts])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
        <Button asChild>
          <Link href="/editor"><Plus className="h-4 w-4 mr-1" /> {tc("newPrompt")}</Link>
        </Button>
      </div>

      <PromptFiltersBar
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        allTags={allTags}
        view={view}
        onViewChange={setView}
        resultCount={filtered.length}
      />

      {view === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {filtered.map((p) => {
            const modelLabel = MODEL_OPTIONS.find((m) => m.value === p.model)?.label ?? p.model
            const statusOpt = STATUS_OPTIONS.find((s) => s.value === p.status)
            return (
              <Link
                key={p.id}
                href={`/prompts/${p.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.title}</div>
                  {p.description && (
                    <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{modelLabel}</Badge>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={cn("inline-block h-1.5 w-1.5 rounded-full", statusOpt?.color)} />
                  <span className="text-xs text-muted-foreground">{statusOpt?.label}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {p.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatDate(p.updatedAt)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    startTransition(async () => {
                      await toggleFavorite(p.id)
                    })
                  }}
                >
                  <Star className={cn("h-3.5 w-3.5", p.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    await copyToClipboard(p.content)
                    startTransition(async () => {
                      await markPromptLastUsed(p.id)
                    })
                    toast.success(tc("copied"))
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{tc("noResults")}</p>
        </div>
      )}
    </div>
  )
}
