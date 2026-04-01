"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Gauge, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  compareBenchmarkRuns,
  getLatestPromptEvolutionComparison,
  getBenchmarkRunsByPromptId,
  runPromptBenchmark,
} from "@/app/actions/benchmark.actions"
import { cn, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type {
  BenchmarkComparison,
  BenchmarkRun,
  PromptEvolutionComparison,
  PromptEvolutionComparisonStrategy,
} from "@/types/benchmark"
import type { PromptVersion } from "@/types/prompt-version"

interface BenchmarkPanelProps {
  promptId: string
  latestVersion: PromptVersion | null
  versions: PromptVersion[]
  evolutionComparison?: PromptEvolutionComparison | null
}

const SCORE_KEYS = [
  "overallScore",
  "clarityScore",
  "reusabilityScore",
  "controllabilityScore",
  "deploymentReadinessScore",
] as const

export function BenchmarkPanel({
  promptId,
  latestVersion,
  versions,
  evolutionComparison = null,
}: BenchmarkPanelProps) {
  const t = useTranslations("benchmark")
  const [runs, setRuns] = useState<BenchmarkRun[]>([])
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(null)
  const [leftRunId, setLeftRunId] = useState<string>("")
  const [rightRunId, setRightRunId] = useState<string>("")
  const [manualEvolutionStrategy, setManualEvolutionStrategy] =
    useState<PromptEvolutionComparisonStrategy | null>(null)
  const [loadedEvolutionComparison, setLoadedEvolutionComparison] =
    useState<PromptEvolutionComparison | null>(null)
  const [loadingEvolution, setLoadingEvolution] = useState(false)
  const [runningBenchmark, startBenchmarkTransition] = useTransition()
  const [comparing, startCompareTransition] = useTransition()

  const hasBaseline = versions.some((version) => version.isBaseline)
  const hasPreviousVersion = versions.length >= 2
  const fallbackEvolutionStrategy: PromptEvolutionComparisonStrategy =
    hasBaseline ? "baseline" : "previous_version"
  const selectedEvolutionStrategy =
    manualEvolutionStrategy &&
    ((manualEvolutionStrategy === "baseline" && hasBaseline) ||
      (manualEvolutionStrategy === "previous_version" && hasPreviousVersion))
      ? manualEvolutionStrategy
      : fallbackEvolutionStrategy

  useEffect(() => {
    let cancelled = false

    async function loadRuns() {
      setLoading(true)
      const result = await getBenchmarkRunsByPromptId(promptId)
      if (cancelled) return

      if (result.success) {
        setRuns(result.data)
        setLeftRunId((current) => current || result.data[0]?.id || "")
        setRightRunId((current) => current || result.data[1]?.id || result.data[0]?.id || "")
      } else {
        toast.error(result.error)
      }
      setLoading(false)
    }

    void loadRuns()

    return () => {
      cancelled = true
    }
  }, [promptId])

  useEffect(() => {
    if (!leftRunId || !rightRunId || leftRunId === rightRunId) {
      return
    }

    startCompareTransition(async () => {
      const result = await compareBenchmarkRuns(leftRunId, rightRunId)
      if (result.success) {
        setComparison(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }, [leftRunId, rightRunId])

  useEffect(() => {
    let cancelled = false

    async function loadEvolutionComparison() {
      setLoadedEvolutionComparison(null)

      if (
        !latestVersion ||
        (selectedEvolutionStrategy === "baseline" && !hasBaseline) ||
        (selectedEvolutionStrategy === "previous_version" && !hasPreviousVersion)
      ) {
        setLoadedEvolutionComparison(null)
        return
      }

      setLoadingEvolution(true)
      const result = await getLatestPromptEvolutionComparison(promptId, selectedEvolutionStrategy)
      if (cancelled) return

      if (result.success) {
        setLoadedEvolutionComparison(result.data)
      } else {
        setLoadedEvolutionComparison(null)
        toast.error(result.error)
      }
      setLoadingEvolution(false)
    }

    void loadEvolutionComparison()

    return () => {
      cancelled = true
    }
  }, [hasBaseline, hasPreviousVersion, latestVersion, promptId, selectedEvolutionStrategy])

  const activeComparison =
    leftRunId && rightRunId && leftRunId !== rightRunId ? comparison : null
  const displayedEvolutionComparison =
    evolutionComparison?.strategy === selectedEvolutionStrategy
      ? evolutionComparison
      : loadedEvolutionComparison?.strategy === selectedEvolutionStrategy
        ? loadedEvolutionComparison
        : null

  const latestRun = runs[0] ?? null
  const versionMap = useMemo(
    () => new Map(versions.map((version) => [version.id, version])),
    [versions]
  )

  const handleRunBenchmark = () => {
    if (!latestVersion) {
      toast.error(t("noVersion"))
      return
    }

    startBenchmarkTransition(async () => {
      const result = await runPromptBenchmark(promptId, latestVersion.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setRuns((current) => [
        result.data,
        ...current.filter((run) => run.id !== result.data.id),
      ])
      setLeftRunId(result.data.id)
      setRightRunId((current) => current || result.data.id)
      toast.success(t("runComplete"))
    })
  }

  const renderScore = (
    label: string,
    value: number,
    emphasis = false
  ) => (
    <div className={cn("rounded-md border p-3", emphasis && "border-primary/50 bg-primary/5")}>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <Progress value={value} />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="font-medium">{t("title")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleRunBenchmark} disabled={runningBenchmark || !latestVersion}>
          <Sparkles className="mr-1 h-4 w-4" />
          {runningBenchmark ? t("running") : t("run")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>{t("loading")}</span>
        </div>
      ) : latestRun ? (
        <div className="space-y-4">
          {displayedEvolutionComparison || loadingEvolution ? (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {displayedEvolutionComparison ? (
                    <>
                      <Badge variant="outline">
                        {displayedEvolutionComparison.strategy === "baseline"
                          ? t("evolution.strategyBaseline")
                          : t("evolution.strategyPrevious")}
                      </Badge>
                      <Badge
                        variant={
                          displayedEvolutionComparison.recommendedForProduction
                            ? "default"
                            : "secondary"
                        }
                      >
                        {displayedEvolutionComparison.recommendedForProduction
                          ? t("evolution.recommended")
                          : t("evolution.iterate")}
                      </Badge>
                    </>
                  ) : null}
                </div>

                {(hasBaseline || hasPreviousVersion) && (
                  <div className="min-w-[220px] space-y-1.5">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("evolution.strategyLabel")}
                    </div>
                    <Select
                      value={selectedEvolutionStrategy}
                      onValueChange={(value) =>
                        setManualEvolutionStrategy(
                          (value as PromptEvolutionComparisonStrategy | null) ?? null
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hasBaseline ? (
                          <SelectItem value="baseline">
                            {t("evolution.viewBaseline")}
                          </SelectItem>
                        ) : null}
                        {hasPreviousVersion ? (
                          <SelectItem value="previous_version">
                            {t("evolution.viewPrevious")}
                          </SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium">{t("evolution.title")}</div>
                {loadingEvolution && !displayedEvolutionComparison ? (
                  <p className="mt-1 text-sm text-muted-foreground">{t("evolution.loading")}</p>
                ) : displayedEvolutionComparison ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {displayedEvolutionComparison.summary}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{t("evolution.empty")}</p>
                )}
              </div>

              {displayedEvolutionComparison ? (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {SCORE_KEYS.map((key) => {
                      const value = displayedEvolutionComparison.deltas[key]

                      return (
                        <div key={key} className="rounded-md border bg-background/80 p-3">
                          <div className="text-sm text-muted-foreground">
                            {t(`evolution.scores.${key}`)}
                          </div>
                          <div
                            className={cn(
                              "mt-1 text-lg font-semibold tabular-nums",
                              value > 0 && "text-green-600",
                              value < 0 && "text-red-600"
                            )}
                          >
                            {value > 0 ? "+" : ""}
                            {value}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md bg-background/80 p-3">
                      <div className="text-sm font-medium">{t("evolution.comparisonRun")}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {t("evolution.versionLabel", {
                          version: displayedEvolutionComparison.comparison.promptVersionNumber,
                        })}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {displayedEvolutionComparison.comparison.summary}
                      </div>
                    </div>
                    <div className="rounded-md bg-background/80 p-3">
                      <div className="text-sm font-medium">{t("evolution.candidateRun")}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {t("evolution.versionLabel", {
                          version: displayedEvolutionComparison.candidate.promptVersionNumber,
                        })}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {displayedEvolutionComparison.candidate.summary}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">
                    {t("latestRun", { version: latestRun.promptVersionNumber })}
                  </h4>
                  <Badge variant={latestRun.recommendedForProduction ? "default" : "outline"}>
                    {latestRun.recommendedForProduction
                      ? t("recommended")
                      : t("needsWork")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{latestRun.summary}</p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold tabular-nums">{latestRun.overallScore}/100</div>
                <div className="text-muted-foreground">
                  {formatDate(latestRun.createdAt)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {renderScore(t("scores.overall"), latestRun.overallScore, true)}
              {renderScore(t("scores.clarity"), latestRun.clarityScore)}
              {renderScore(t("scores.reusability"), latestRun.reusabilityScore)}
              {renderScore(t("scores.controllability"), latestRun.controllabilityScore)}
              {renderScore(
                t("scores.deploymentReadiness"),
                latestRun.deploymentReadinessScore
              )}
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-medium">{t("suggestions")}</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {latestRun.improvementSuggestions.map((suggestion, index) => (
                  <li key={`${suggestion}-${index}`} className="rounded-md bg-muted/30 px-3 py-2">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {runs.length >= 2 && (
            <div className="rounded-lg border p-4">
              <div className="mb-3">
                <h4 className="font-medium">{t("compareTitle")}</h4>
                <p className="text-sm text-muted-foreground">{t("compareDescription")}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="text-sm text-muted-foreground">{t("compareLeft")}</div>
                  <Select
                    value={leftRunId}
                    onValueChange={(value) => setLeftRunId(value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {runs.map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          {t("runLabel", {
                            version: run.promptVersionNumber,
                            date: formatDate(run.createdAt),
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm text-muted-foreground">{t("compareRight")}</div>
                  <Select
                    value={rightRunId}
                    onValueChange={(value) => setRightRunId(value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {runs.map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          {t("runLabel", {
                            version: run.promptVersionNumber,
                            date: formatDate(run.createdAt),
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeComparison ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {SCORE_KEYS.map((key) => {
                    const value = activeComparison.deltas[key]
                    return (
                      <div key={key} className="rounded-md border p-3">
                        <div className="text-sm text-muted-foreground">
                          {t(`scores.${key.replace("Score", "")}`)}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-lg font-semibold tabular-nums",
                            value > 0 && "text-green-600",
                            value < 0 && "text-red-600"
                          )}
                        >
                          {value > 0 ? "+" : ""}
                          {value}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : comparing ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("comparing")}</p>
              ) : null}

              {(leftRunId || rightRunId) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[leftRunId, rightRunId]
                    .map((runId) => runs.find((run) => run.id === runId) ?? null)
                    .map((run, index) =>
                      run ? (
                        <div key={run.id} className="rounded-md bg-muted/20 p-3">
                          <div className="text-sm font-medium">
                            {index === 0 ? t("compareLeft") : t("compareRight")}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {versionMap.get(run.promptVersionId)?.changeSummary ??
                              run.promptVersionChangeSummary}
                          </div>
                        </div>
                      ) : null
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  )
}
