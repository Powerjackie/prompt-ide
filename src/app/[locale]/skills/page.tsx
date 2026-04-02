"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowDownAZ,
  ArrowRight,
  Clock3,
  Filter,
  Plus,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { SkillCard } from "@/components/skills/skill-card"
import { getSkills } from "@/app/actions/skill.actions"
import { getSkillAttentionKey, getSkillAttentionRank } from "@/lib/skill-health"
import { cn, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { SkillHealthState, SkillListItem, SkillSortMode } from "@/types/skill"

type SkillHealthFilter = "all" | SkillHealthState

const HEALTH_PRIORITY: Record<SkillHealthState, number> = {
  ready: 0,
  watch: 1,
  setup: 2,
}

const FILTER_CARD_VARIANTS: Record<SkillHealthFilter, string> = {
  all: "border-primary/20 bg-primary/6 text-foreground dark:border-primary/28 dark:bg-primary/10 dark:shadow-[0_18px_44px_-30px_rgba(79,246,255,0.38)]",
  ready: "border-primary/20 bg-primary/8 text-foreground dark:border-primary/30 dark:bg-primary/12 dark:shadow-[0_18px_44px_-30px_rgba(79,246,255,0.42)]",
  watch: "border-chart-3/25 bg-chart-3/8 text-foreground dark:border-chart-5/24 dark:bg-chart-5/10 dark:shadow-[0_18px_44px_-30px_rgba(255,79,216,0.3)]",
  setup: "border-border/70 bg-background/70 text-foreground dark:border-chart-2/22 dark:bg-chart-2/10 dark:shadow-[0_18px_44px_-30px_rgba(106,124,255,0.28)]",
}

function getPriorityAction(skill: SkillListItem) {
  const reasonKey = getSkillAttentionKey(skill.health)

  if (reasonKey === "needsBaseline") {
    return { href: `/prompts/${skill.entryPromptId}#versions`, labelKey: "setBaseline" as const }
  }

  if (reasonKey === "needsBenchmark") {
    return { href: `/prompts/${skill.entryPromptId}#benchmark`, labelKey: "runBenchmark" as const }
  }

  if (reasonKey === "needsValidation") {
    return { href: `/skills/${skill.id}/run`, labelKey: "validateSkill" as const }
  }

  if (reasonKey === "needsIteration") {
    return { href: `/prompts/${skill.entryPromptId}#agent`, labelKey: "iterateSkill" as const }
  }

  return { href: `/skills/${skill.id}`, labelKey: "openDetail" as const }
}

export default function SkillsPage() {
  const t = useTranslations("skills")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [skills, setSkills] = useState<SkillListItem[]>([])
  const [loading, setLoading] = useState(true)

  const healthFilter: SkillHealthFilter = (() => {
    const value = searchParams.get("health")
    if (value === "ready" || value === "watch" || value === "setup") {
      return value
    }
    return "all"
  })()

  const sortMode: SkillSortMode = (() => {
    const value = searchParams.get("sort")
    if (value === "updated" || value === "production") {
      return value
    }
    return "health"
  })()

  const readyCount = skills.filter((skill) => skill.health.state === "ready").length
  const watchCount = skills.filter((skill) => skill.health.state === "watch").length
  const setupCount = skills.filter((skill) => skill.health.state === "setup").length

  const updateListState = (next: { health?: SkillHealthFilter; sort?: SkillSortMode }) => {
    const params = new URLSearchParams(searchParams.toString())
    const targetHealth = next.health ?? healthFilter
    const targetSort = next.sort ?? sortMode

    if (targetHealth === "all") {
      params.delete("health")
    } else {
      params.set("health", targetHealth)
    }

    if (targetSort === "health") {
      params.delete("sort")
    } else {
      params.set("sort", targetSort)
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const visibleSkills = (() => {
    const filtered =
      healthFilter === "all"
        ? skills
        : skills.filter((skill) => skill.health.state === healthFilter)

    return [...filtered].sort((left, right) => {
      if (sortMode === "production") {
        const stateDelta =
          HEALTH_PRIORITY[left.health.state] - HEALTH_PRIORITY[right.health.state]

        if (stateDelta !== 0) {
          return stateDelta
        }

        const recommendationDelta =
          Number(right.health.recommendedForProduction) -
          Number(left.health.recommendedForProduction)

        if (recommendationDelta !== 0) {
          return recommendationDelta
        }

        const benchmarkDelta =
          (right.health.benchmarkScore ?? -1) - (left.health.benchmarkScore ?? -1)

        if (benchmarkDelta !== 0) {
          return benchmarkDelta
        }

        const runDelta =
          new Date(right.health.recentRunCreatedAt ?? 0).getTime() -
          new Date(left.health.recentRunCreatedAt ?? 0).getTime()

        if (runDelta !== 0) {
          return runDelta
        }
      }

      if (sortMode === "updated") {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      }

      const healthDelta =
        HEALTH_PRIORITY[left.health.state] - HEALTH_PRIORITY[right.health.state]

      if (healthDelta !== 0) {
        return healthDelta
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    })
  })()

  const attentionSkills = (() => {
    return [...skills]
      .filter((skill) => skill.health.state !== "ready")
      .sort((left, right) => {
        const attentionDelta =
          getSkillAttentionRank(left.health) - getSkillAttentionRank(right.health)

        if (attentionDelta !== 0) {
          return attentionDelta
        }

        const healthDelta =
          HEALTH_PRIORITY[right.health.state] - HEALTH_PRIORITY[left.health.state]

        if (healthDelta !== 0) {
          return healthDelta
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      })
      .slice(0, 3)
  })()

  useEffect(() => {
    let cancelled = false

    async function loadSkills() {
      setLoading(true)
      const result = await getSkills()
      if (cancelled) return

      if (result.success) {
        setSkills(result.data)
      } else {
        toast.error(result.error)
      }

      setLoading(false)
    }

    void loadSkills()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const overviewCards = [
    {
      key: "all" as const,
      icon: Sparkles,
      count: skills.length,
      label: t("filters.all"),
      hint: t("overview.hints.all"),
    },
    {
      key: "ready" as const,
      icon: ShieldCheck,
      count: readyCount,
      label: t("health.states.ready"),
      hint: t("overview.hints.ready"),
    },
    {
      key: "watch" as const,
      icon: Clock3,
      count: watchCount,
      label: t("health.states.watch"),
      hint: t("overview.hints.watch"),
    },
    {
      key: "setup" as const,
      icon: Wrench,
      count: setupCount,
      label: t("health.states.setup"),
      hint: t("overview.hints.setup"),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {t("title")}
          </>
        }
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild className="rounded-2xl">
            <Link href="/skills/new">
              <Plus className="mr-1 h-4 w-4" />
              {t("newSkill")}
            </Link>
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => {
            const active = healthFilter === card.key
            const Icon = card.icon

            return (
              <button
                key={card.key}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateListState({ health: active || card.key === "all" ? "all" : card.key })
                }
                className={cn(
                  "rounded-[1.75rem] border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_48px_-36px_rgba(79,70,229,0.5)]",
                  active
                    ? FILTER_CARD_VARIANTS[card.key]
                    : "border-border/60 bg-card/75 text-foreground hover:border-primary/15 hover:bg-card dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(17,22,37,0.9),rgba(21,27,46,0.86))] dark:hover:border-primary/24 dark:hover:shadow-[0_22px_54px_-36px_rgba(79,246,255,0.4)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-current/10 bg-background/60">
                    <Icon className="h-5 w-5" />
                  </div>
                  {active ? (
                    <span className="rounded-full border border-current/15 bg-background/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {t("overview.active")}
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 space-y-1">
                  <div className="text-3xl font-semibold tracking-tight">{card.count}</div>
                  <div className="text-sm font-medium">{card.label}</div>
                  <p className="text-xs leading-5 text-muted-foreground">{card.hint}</p>
                </div>
              </button>
            )
          })}
        </div>
      </PageHeader>

      {skills.length === 0 ? (
        <div className="app-panel border-dashed py-14 text-center text-muted-foreground">
          <Sparkles className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>{t("empty")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="app-panel flex flex-col gap-4 rounded-[2rem] border-border/60 bg-card/85 p-5 dark:border-primary/12">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    {t("filters.title")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "ready", "watch", "setup"] as const).map((option) => {
                      const active = healthFilter === option
                      const label =
                        option === "all" ? t("filters.all") : t(`health.states.${option}`)

                      return (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className="rounded-full px-4"
                          aria-pressed={active}
                          onClick={() => updateListState({ health: option })}
                        >
                          {label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    <ArrowDownAZ className="h-3.5 w-3.5" />
                    {t("sort.title")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["health", "updated", "production"] as const).map((option) => {
                      const active = sortMode === option

                      return (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={active ? "secondary" : "ghost"}
                          className="rounded-full px-4"
                          aria-pressed={active}
                          onClick={() => updateListState({ sort: option })}
                        >
                          {t(`sort.${option}`)}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-foreground/80">
                  {t("shownCount", { count: visibleSkills.length })}
                </span>
                {healthFilter !== "all" ? (
                  <span className="rounded-full border border-border/60 bg-secondary/70 px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {t("filters.active", { filter: t(`health.states.${healthFilter}`) })}
                  </span>
                ) : null}
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {t("sort.active", { sort: t(`sort.${sortMode}`) })}
                </span>
              </div>
            </div>

            <div className="app-panel flex flex-col gap-4 rounded-[2rem] border-border/60 bg-card/85 p-5 dark:border-primary/12">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  {t("priorities.title")}
                </div>
                <p className="text-sm text-muted-foreground">{t("priorities.description")}</p>
              </div>

              {attentionSkills.length > 0 ? (
                <div className="space-y-3">
                  {attentionSkills.map((skill) => {
                    const reasonKey = getSkillAttentionKey(skill.health)
                    const priorityAction = getPriorityAction(skill)

                    return (
                      <div
                        key={skill.id}
                        className="rounded-[1.5rem] border border-border/60 bg-muted/25 p-4 dark:border-primary/12 dark:bg-background/58"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-foreground">{skill.name}</div>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {t(`priorities.reasons.${reasonKey}`)}
                            </p>
                          </div>
                          <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            {t(`health.states.${skill.health.state}`)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {t("entryPrompt")}: {skill.entryPrompt.title}
                          </span>
                          <span className="text-border">·</span>
                          <span>
                            {t("updated")}: {formatDate(skill.updatedAt)}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" className="rounded-full" asChild>
                            <Link href={priorityAction.href}>
                              {t(`priorities.actions.${priorityAction.labelKey}`)}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full" asChild>
                            <Link href={`/skills/${skill.id}`}>
                              {t("priorities.open")}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-full" asChild>
                            <Link href={`/skills/${skill.id}/run`}>
                              {t("priorities.run")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/50 px-4 py-6 text-sm text-muted-foreground">
                  {t("priorities.empty")}
                </div>
              )}
            </div>
          </div>

          <div className="app-panel flex flex-col gap-4 rounded-[2rem] border-border/60 bg-card/85 p-5 dark:border-primary/12">
            {visibleSkills.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-border/70 py-14 text-center text-muted-foreground">
                <Sparkles className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p>{t("emptyFiltered")}</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-4 rounded-full"
                  onClick={() => updateListState({ health: "all" })}
                >
                  {t("filters.reset")}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
