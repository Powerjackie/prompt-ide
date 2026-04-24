"use client"

import { Suspense, useEffect, useMemo, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Clock, Copy, FileText, Plus, Sparkles, Star } from "lucide-react"
import { toast } from "sonner"
import {
  getAllTags,
  markPromptLastUsed,
  toggleFavorite,
} from "@/app/actions/prompt-surface.actions"
import type { PromptFilterParams } from "@/app/actions/prompt-surface.actions"
import { PromptFiltersBar } from "@/components/prompts/prompt-filters"
import { PromptCard } from "@/components/prompts/prompt-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { PageShell } from "@/components/ui/page-shell"
import { SurfaceCard } from "@/components/ui/surface-card"
import { STATUS_OPTIONS } from "@/lib/constants"
import { cn, copyToClipboard, formatDate } from "@/lib/utils"
import { usePromptFilters } from "@/hooks/use-prompt-filters"
import { usePromptsPaginated } from "@/hooks/use-prompts"

export interface PromptsClientProps {
  initialView?: "card" | "list"
}

export function PromptsClient({ initialView = "card" }: PromptsClientProps) {
  return (
    <Suspense>
      <PromptsContent initialView={initialView} />
    </Suspense>
  )
}

function PromptsContent({ initialView }: { initialView: "card" | "list" }) {
  const t = useTranslations("prompts")
  const tc = useTranslations("common")
  const tm = useTranslations("models")
  const ts = useTranslations("status")
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [view, setView] = useState<"card" | "list">(() => initialView)
  const { filters, updateFilter, resetFilters } = usePromptFilters()
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), filters.search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [filters.search])

  const serverFilters = useMemo<PromptFilterParams>(
    () => ({
      search: debouncedSearch || undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      model: filters.model !== "all" ? filters.model : undefined,
      tag: filters.tag !== "all" ? filters.tag : undefined,
    }),
    [debouncedSearch, filters.status, filters.model, filters.tag]
  )

  const { prompts, loading, page, total, totalPages, nextPage, prevPage } =
    usePromptsPaginated(12, serverFilters)

  useEffect(() => {
    let cancelled = false
    void getAllTags().then((result) => {
      if (cancelled) return
      if (result.success) setAllTags(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia("(max-width: 767px)")
    const syncView = () => {
      if (media.matches) setView("card")
    }
    syncView()
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", syncView)
      return () => media.removeEventListener("change", syncView)
    }
    media.addListener(syncView)
    return () => media.removeListener(syncView)
  }, [])

  const sortedPrompts = useMemo(() => {
    const result = [...prompts]
    result.sort((a, b) => {
      switch (filters.sort) {
        case "updated":
          return b.updatedAt.localeCompare(a.updatedAt)
        case "created":
          return b.createdAt.localeCompare(a.createdAt)
        case "title":
          return a.title.localeCompare(b.title)
        case "lastUsed":
          return (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "")
        default:
          return 0
      }
    })
    return result
  }, [prompts, filters.sort])

  const tagParam = searchParams.get("tag")
  useEffect(() => {
    if (tagParam && filters.tag === "all") updateFilter("tag", tagParam)
  }, [filters.tag, tagParam, updateFilter])

  const highlightedPrompts = sortedPrompts.slice(0, 3)

  if (loading && prompts.length === 0) {
    return (
      <PageShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-4" />
            {t("libraryEyebrow")}
          </span>
        }
        title={t("title")}
        description={t("libraryDescription")}
        actions={
          <Button asChild data-variant="primary">
            <Link href="/editor">
              <Plus className="mr-1 size-4" />
              {tc("newPrompt")}
            </Link>
          </Button>
        }
      />

      {highlightedPrompts.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {highlightedPrompts.map((prompt) => (
            <Link
              className="lab-card block p-4 no-underline hover:bg-accent"
              data-interactive="true"
              href={`/prompts/${prompt.id}`}
              key={prompt.id}
            >
              <div className="ui-body flex items-center gap-2 text-muted-foreground">
                <FileText className="size-4" />
                {ts(prompt.status)}
              </div>
              <h3 className="mt-3 line-clamp-1 text-xl">{prompt.title}</h3>
              <p className="ui-body mt-2 line-clamp-2 text-muted-foreground">
                {prompt.description || prompt.content}
              </p>
            </Link>
          ))}
        </div>
      ) : null}

      <SurfaceCard className="space-y-5">
        <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl">{tc("promptCount", { count: total })}</h2>
            <p className="ui-body text-muted-foreground">{t("filtersDescription")}</p>
          </div>
        </div>

        <PromptFiltersBar
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          allTags={allTags}
          view={view}
          onViewChange={setView}
          resultCount={total}
        />

        {view === "card" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {sortedPrompts.map((prompt) => (
              <div className="h-full" key={prompt.id}>
                <PromptCard prompt={prompt} />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
            <div className="grid min-w-[720px] grid-cols-[minmax(0,2.3fr)_auto_auto_auto] items-center gap-4 border-b border-border bg-muted px-5 py-3 font-mono text-xs text-muted-foreground">
              <span>{t("listHeaders.prompt")}</span>
              <span>{t("listHeaders.status")}</span>
              <span>{t("listHeaders.tags")}</span>
              <span>{t("listHeaders.updated")}</span>
            </div>
            <div className="divide-y divide-border">
              {sortedPrompts.map((prompt) => {
                const modelLabel = tm(prompt.model)
                const statusOption = STATUS_OPTIONS.find((option) => option.value === prompt.status)
                return (
                  <div
                    className="grid min-w-[720px] grid-cols-[minmax(0,2.3fr)_auto_auto_auto] items-center gap-4 px-5 py-4 transition hover:bg-accent"
                    key={prompt.id}
                  >
                    <div className="min-w-0">
                      <Link className="block truncate font-medium no-underline" href={`/prompts/${prompt.id}`}>
                        {prompt.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {modelLabel}
                        </Badge>
                        <span className="truncate">{prompt.description || prompt.content}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn("inline-block size-2 rounded-full", statusOption?.color)} />
                      <span>{statusOption ? ts(statusOption.value) : prompt.status}</span>
                    </div>

                    <div className="flex min-w-[180px] flex-wrap justify-end gap-1.5">
                      {prompt.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="font-mono text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {formatDate(prompt.updatedAt)}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={prompt.isFavorite ? tc("unfavorite") : tc("favorite")}
                        onClick={(event) => {
                          event.preventDefault()
                          startTransition(async () => {
                            const result = await toggleFavorite(prompt.id)
                            if (!result.success) toast.error(result.error)
                          })
                        }}
                        disabled={pending}
                      >
                        <Star
                          className={cn(
                            "size-3.5",
                            prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={tc("copy")}
                        onClick={async (event) => {
                          event.preventDefault()
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
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button type="button" variant="outline" onClick={prevPage} disabled={page <= 1}>
              Prev
            </Button>
            <span className="font-mono text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button type="button" variant="outline" onClick={nextPage} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        ) : null}

        {sortedPrompts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <FileText className="size-12 text-muted-foreground/40" />
            <p className="font-medium">{tc("noResults")}</p>
            <p className="ui-body text-muted-foreground">{t("emptyFilteredDescription")}</p>
          </div>
        ) : null}
      </SurfaceCard>
    </PageShell>
  )
}
