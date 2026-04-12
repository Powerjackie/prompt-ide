"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { flushSync } from "react-dom"
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
import { usePromptsPaginated } from "@/hooks/use-prompts"
import { usePromptFilters } from "@/hooks/use-prompt-filters"
import { useStaggerReveal } from "@/hooks/use-stagger-reveal"
import { markPromptLastUsed, toggleFavorite } from "@/app/actions/prompt-surface.actions"
import { STATUS_OPTIONS } from "@/lib/constants"
import { Draggable, Flip, gsap, useGSAP } from "@/lib/gsap-config"
import { cn, copyToClipboard, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Prompt } from "@/types/prompt"

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

function moveId(ids: string[], from: number, to: number) {
  const next = [...ids]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function PromptsContent({ initialView }: { initialView: "card" | "list" }) {
  const t = useTranslations("prompts")
  const tc = useTranslations("common")
  const tm = useTranslations("models")
  const ts = useTranslations("status")
  const searchParams = useSearchParams()
  const {
    prompts: pagePrompts,
    loading,
    page,
    total,
    totalPages,
    nextPage,
    prevPage,
  } = usePromptsPaginated(24)
  const [pending, startTransition] = useTransition()
  const [view, setView] = useState<"card" | "list">(() => initialView)
  const [manualOrderIds, setManualOrderIds] = useState<string[]>([])
  const pageRef = useRef<HTMLDivElement>(null)
  const cardGridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia("(max-width: 767px)")
    const syncView = () => {
      if (media.matches) {
        setView("card")
      }
    }

    syncView()

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", syncView)
      return () => media.removeEventListener("change", syncView)
    }

    media.addListener(syncView)
    return () => media.removeListener(syncView)
  }, [])

  const prompts = pagePrompts

  const { filters, filtered, updateFilter, resetFilters } = usePromptFilters(prompts)
  const promptCardsRef = useStaggerReveal(
    ".gs-prompt-card",
    { stagger: 0.04, y: 15 },
    [loading, view, filtered.length]
  )

  const displayPrompts = useMemo(() => {
    if (!manualOrderIds.length) return filtered

    const promptById = new Map(filtered.map((prompt) => [prompt.id, prompt]))
    const ordered = manualOrderIds
      .map((id) => promptById.get(id))
      .filter((prompt): prompt is Prompt => Boolean(prompt))
    const orderedIds = new Set(ordered.map((prompt) => prompt.id))
    const missing = filtered.filter((prompt) => !orderedIds.has(prompt.id))

    return [...ordered, ...missing]
  }, [filtered, manualOrderIds])

  const filteredIdsKey = useMemo(() => filtered.map((prompt) => prompt.id).join("|"), [filtered])
  const displayIdsKey = useMemo(
    () => displayPrompts.map((prompt) => prompt.id).join("|"),
    [displayPrompts]
  )

  useEffect(() => {
    if (!manualOrderIds.length) return

    const filteredIds = new Set(filteredIdsKey.split("|").filter(Boolean))
    setManualOrderIds((ids) => ids.filter((id) => filteredIds.has(id)))
  }, [filteredIdsKey, manualOrderIds.length])

  const setCardGridRefs = useCallback(
    (node: HTMLDivElement | null) => {
      cardGridRef.current = node
      promptCardsRef.current = node
    },
    [promptCardsRef]
  )

  const { contextSafe } = useGSAP({ scope: pageRef })

  const handleViewChange = contextSafe((nextView: "card" | "list") => {
    if (nextView === view) return

    const root = pageRef.current
    const targets = root
      ? gsap.utils.toArray<HTMLElement>(".prompt-library-item", root)
      : []
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!root || prefersReduced || targets.length === 0) {
      setView(nextView)
      return
    }

    const state = Flip.getState(targets)
    flushSync(() => setView(nextView))

    Flip.from(state, {
      absolute: true,
      duration: 0.55,
      ease: "power2.inOut",
      nested: true,
      scale: true,
      stagger: 0.015,
      targets: root.querySelectorAll(".prompt-library-item"),
      onComplete: () => {
        const currentTargets = root.querySelectorAll(".prompt-library-item")
        gsap.set(currentTargets, { autoAlpha: 1, clearProps: "opacity,transform" })
      },
    })
  })

  useGSAP(
    () => {
      const root = pageRef.current
      const grid = cardGridRef.current
      if (!root || !grid || view !== "card") return

      const mm = gsap.matchMedia()

      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          noPreference: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (context.conditions?.reduce) return

          const cards = gsap.utils.toArray<HTMLElement>(".prompt-draggable-card", grid)
          if (cards.length < 2) return

          const instances = cards.flatMap((card) =>
            Draggable.create(card, {
              type: "x,y",
              trigger: card.querySelector(".prompt-card-drag-handle") ?? card,
              bounds: grid,
              cursor: "grab",
              activeCursor: "grabbing",
              edgeResistance: 0.85,
              zIndexBoost: true,
              dragClickables: true,
              onDragStart() {
                gsap.set(this.target, { rotate: 0.35, zIndex: 30 })
              },
              onDragEnd() {
                const target = this.target as HTMLElement
                const promptId = target.dataset.promptId
                if (!promptId) {
                  gsap.to(target, {
                    x: 0,
                    y: 0,
                    rotate: 0,
                    duration: 0.2,
                    clearProps: "transform,zIndex",
                  })
                  return
                }

                const targetRect = target.getBoundingClientRect()
                const targetCenter = {
                  x: targetRect.left + targetRect.width / 2,
                  y: targetRect.top + targetRect.height / 2,
                }
                const siblings = gsap.utils.toArray<HTMLElement>(".prompt-draggable-card", grid)
                let nearestId = promptId
                let nearestDistance = Number.POSITIVE_INFINITY

                siblings.forEach((element) => {
                  const siblingId = element.dataset.promptId
                  if (!siblingId || siblingId === promptId) return

                  const rect = element.getBoundingClientRect()
                  const center = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  }
                  const distance = Math.hypot(center.x - targetCenter.x, center.y - targetCenter.y)

                  if (distance < nearestDistance) {
                    nearestDistance = distance
                    nearestId = siblingId
                  }
                })

                const currentIds = displayPrompts.map((prompt) => prompt.id)
                const from = currentIds.indexOf(promptId)
                const to = currentIds.indexOf(nearestId)

                if (from >= 0 && to >= 0 && from !== to) {
                  const state = Flip.getState(siblings)
                  flushSync(() => {
                    setManualOrderIds(moveId(currentIds, from, to))
                  })
                  Flip.from(state, {
                    absolute: true,
                    duration: 0.42,
                    ease: "power2.inOut",
                    nested: true,
                    scale: true,
                    targets: grid.querySelectorAll(".prompt-draggable-card"),
                    onComplete: () => {
                      gsap.set(grid.querySelectorAll(".prompt-draggable-card"), {
                        autoAlpha: 1,
                        clearProps: "opacity,transform",
                      })
                    },
                  })
                }

                gsap.to(target, {
                  x: 0,
                  y: 0,
                  rotate: 0,
                  duration: 0.2,
                  ease: "power2.out",
                  clearProps: "transform,zIndex",
                })
              },
            })
          )

          return () => {
            instances.forEach((instance) => instance.kill())
          }
        }
      )

      return () => {
        mm.revert()
      }
    },
    { scope: pageRef, dependencies: [view, displayIdsKey] }
  )

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

  const highlightedPrompts = displayPrompts.slice(0, 3)

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div ref={pageRef} className="space-y-8">
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
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {highlightedPrompts.map((prompt) => (
            <Link
              key={prompt.id}
              href={`/prompts/${prompt.id}`}
              className="rounded-2xl border border-white/60 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card dark:border-primary/12 dark:hover:border-primary/24"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
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
          title={tc("promptCount", { count: total })}
          description={t("filtersDescription")}
        />

        <PromptFiltersBar
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          allTags={allTags}
          view={view}
          onViewChange={handleViewChange}
          resultCount={filtered.length}
        />

        {view === "card" ? (
          <div
            ref={setCardGridRefs}
            className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3"
          >
            {displayPrompts.map((prompt, index) => (
              <div
                key={prompt.id}
                data-flip-id={`prompt-${prompt.id}`}
                data-prompt-id={prompt.id}
                className={cn(
                  "prompt-library-item prompt-draggable-card relative h-full touch-pan-y",
                  index < 20 && "gs-prompt-card"
                )}
              >
                <button
                  type="button"
                  className="prompt-card-drag-handle absolute right-3 top-14 z-10 hidden h-8 w-8 cursor-grab items-center justify-center border-2 border-border bg-primary font-mono text-[10px] font-black text-primary-foreground shadow-[2px_2px_0_0_var(--border)] active:cursor-grabbing md:flex"
                  aria-label={`Reorder ${prompt.title}`}
                >
                  ::
                </button>
                <PromptCard prompt={prompt} />
              </div>
            ))}
          </div>
        ) : (
          <div className="brutal-border brutal-shadow bg-card overflow-hidden dark:shadow-none">
            <div className="overflow-x-auto">
              <div className="grid min-w-[720px] grid-cols-[minmax(0,2.3fr)_auto_auto_auto] items-center gap-4 border-b-2 border-border bg-foreground px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-background">
                <span>{t("listHeaders.prompt")}</span>
                <span>{t("listHeaders.status")}</span>
                <span>{t("listHeaders.tags")}</span>
                <span>{t("listHeaders.updated")}</span>
              </div>
              <div className="divide-y-2 divide-border">
                {displayPrompts.map((prompt) => {
                  const modelLabel = tm(prompt.model)
                  const statusOption = STATUS_OPTIONS.find((option) => option.value === prompt.status)

                  return (
                    <div
                      key={prompt.id}
                      data-flip-id={`prompt-${prompt.id}`}
                      className="prompt-library-item grid min-w-[720px] grid-cols-[minmax(0,2.3fr)_auto_auto_auto] items-center gap-4 px-5 py-4 transition hover:bg-foreground hover:text-background"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/prompts/${prompt.id}`}
                          className="block truncate text-sm font-semibold outline-none focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {prompt.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="rounded-none border-border bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase"
                          >
                            {modelLabel}
                          </Badge>
                          <Link
                            href={`/prompts/${prompt.id}`}
                            className="line-clamp-1 truncate outline-none focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            {prompt.description || prompt.content}
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={cn("inline-block h-2 w-2 rounded-full", statusOption?.color)}
                        />
                        <span>{statusOption ? ts(statusOption.value) : prompt.status}</span>
                      </div>

                      <div className="flex min-w-[180px] flex-wrap justify-end gap-1.5">
                        {prompt.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="rounded-none border-border bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase"
                          >
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
                          className="ml-2 h-8 w-8 rounded-none border border-current"
                          aria-label={prompt.isFavorite ? tc("unfavorite") : tc("favorite")}
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
                          className="h-8 w-8 rounded-none border border-current"
                          aria-label={tc("copy")}
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
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={prevPage}
              disabled={page <= 1}
              className="brutal-border brutal-shadow-sm px-4 py-2 font-mono text-sm font-semibold disabled:opacity-40 disabled:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
            >
              ←
            </button>
            <span className="font-mono text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={nextPage}
              disabled={page >= totalPages}
              className="brutal-border brutal-shadow-sm px-4 py-2 font-mono text-sm font-semibold disabled:opacity-40 disabled:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
            >
              →
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="app-panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center dark:shadow-none">
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
