"use client"

import { Suspense, useEffect, useMemo, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Clock, Copy, FileText, Plus, Sparkles, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/layout/section-header"
import { PromptCard } from "@/components/prompts/prompt-card"
import { PromptFiltersBar } from "@/components/prompts/prompt-filters"
import { usePrompts } from "@/hooks/use-prompts"
import { usePromptFilters } from "@/hooks/use-prompt-filters"
import { markPromptLastUsed, toggleFavorite } from "@/app/actions/prompt.actions"
import { STATUS_OPTIONS } from "@/lib/constants"
import { cn, copyToClipboard, formatDate } from "@/lib/utils"
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
  const tm = useTranslations("models")
  const ts = useTranslations("status")
  const searchParams = useSearchParams()
  const { prompts: allPrompts, loading } = usePrompts()
  const [pending, startTransition] = useTransition()
  const [view, setView] = useState<"card" | "list">("card")

  const prompts = useMemo(
    () => allPrompts.filter((prompt) => prompt.status !== "archived"),
    [allPrompts]
  )

  const { filters, filtered, updateFilter, resetFilters } = usePromptFilters(prompts)

  const tagParam = searchParams.get("tag")
  useEffect(() => {
    if (tagParam && filters.tag === "all") {
      updateFilter("tag", tagParam)
    }
  }, [filters.tag, tagParam, updateFilter])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    prompts.forEach((prompt) => prompt.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [prompts])

  const highlightedPrompts = filtered.slice(0, 3)

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {t("libraryEyebrow")}
          </>
        }
        title={t("title")}
        description={t("libraryDescription")}
        actions={
          <Button asChild className="rounded-2xl">
            <Link href="/editor">
              <Plus className="mr-1 h-4 w-4" />
              {tc("newPrompt")}
            </Link>
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {highlightedPrompts.map((prompt) => (
            <Link
              key={prompt.id}
              href={`/prompts/${prompt.id}`}
              className="rounded-2xl border border-white/60 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.72),rgba(17,22,37,0.86))] dark:hover:border-primary/24 dark:hover:bg-[linear-gradient(180deg,rgba(17,22,37,0.92),rgba(21,27,46,0.92))] dark:hover:shadow-[0_22px_54px_-34px_rgba(79,246,255,0.42)]"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <FileText className="h-3.5 w-3.5" />
                {ts(prompt.status)}
              </div>
              <div className="mt-3 line-clamp-1 text-sm font-semibold">{prompt.title}</div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {prompt.description || prompt.content}
              </p>
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="space-y-5">
        <SectionHeader
          title={tc("promptCount", { count: filtered.length })}
          description={t("filtersDescription")}
        />

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div className="app-panel overflow-hidden">
            <div className="grid grid-cols-[minmax(0,2.3fr)_auto_auto_auto] items-center gap-4 border-b border-border/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>{t("listHeaders.prompt")}</span>
              <span>{t("listHeaders.status")}</span>
              <span>{t("listHeaders.tags")}</span>
              <span>{t("listHeaders.updated")}</span>
            </div>
            <div className="divide-y divide-border/70">
              {filtered.map((prompt) => {
                const modelLabel = tm(prompt.model)
                const statusOption = STATUS_OPTIONS.find((option) => option.value === prompt.status)

                return (
                  <Link
                    key={prompt.id}
                    href={`/prompts/${prompt.id}`}
                    className="grid grid-cols-[minmax(0,2.3fr)_auto_auto_auto] items-center gap-4 px-5 py-4 transition hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{prompt.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-full px-2.5 py-0.5 dark:border-primary/18 dark:bg-background/65">
                          {modelLabel}
                        </Badge>
                        <span className="line-clamp-1 truncate">
                          {prompt.description || prompt.content}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn("inline-block h-2 w-2 rounded-full", statusOption?.color)} />
                      <span>{statusOption ? ts(statusOption.value) : prompt.status}</span>
                    </div>

                    <div className="flex min-w-[180px] flex-wrap justify-end gap-1.5">
                      {prompt.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="rounded-full px-2.5 py-0.5 dark:border-primary/18 dark:bg-background/65">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(prompt.updatedAt)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-8 w-8 rounded-2xl"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          startTransition(async () => {
                            const result = await toggleFavorite(prompt.id)
                            if (!result.success) toast.error(result.error)
                          })
                        }}
                        disabled={pending}
                      >
                        <Star
                          className={cn(
                            "h-3.5 w-3.5",
                            prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-2xl"
                        onClick={async (event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          const ok = await copyToClipboard(prompt.content)
                          if (!ok) {
                            toast.error(tc("copyFailed"))
                            return
                          }
                          startTransition(async () => {
                            const result = await markPromptLastUsed(prompt.id)
                            if (!result.success) toast.error(result.error)
                          })
                          toast.success(tc("copied"))
                        }}
                        disabled={pending}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="app-panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="font-medium">{tc("noResults")}</p>
              <p className="text-sm text-muted-foreground">
                {t("emptyFilteredDescription")}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
