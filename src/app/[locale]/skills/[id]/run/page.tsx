"use client"

import { use, useEffect, useMemo, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  BookmarkPlus,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Gauge,
  Play,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/layout/section-header"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { runStatelessAgentAnalysis } from "@/app/actions/agent.actions"
import {
  deleteSkillRunPreset,
  getSkillRunContext,
  saveRecentSkillRunValues,
  saveSkillRunPreset,
  saveSkillRunRecord,
} from "@/app/actions/skill.actions"
import { getSkillHealthVariant } from "@/lib/skill-health"
import { extractPromptVariables, renderPromptTemplate } from "@/lib/prompt-render"
import { copyToClipboard, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { AgentAnalysisResult, AgentTrajectoryStep } from "@/types/agent"
import type { SkillRunContext, SkillRunPreset, SkillRunRecord } from "@/types/skill"

interface FieldDefinition {
  name: string
  description: string
  defaultValue: string
}

function buildInitialFieldValues(context: SkillRunContext) {
  const placeholderDefaults = Object.fromEntries(
    extractPromptVariables(context.entryPromptContent).map((name) => [name, ""])
  )
  const schemaDefaults = Object.fromEntries(
    Object.keys(context.skill.inputSchema).map((name) => [name, ""])
  )
  const variableDefaults = Object.fromEntries(
    context.entryPromptVariables.map((variable) => [variable.name, variable.defaultValue ?? ""])
  )

  return {
    ...placeholderDefaults,
    ...schemaDefaults,
    ...variableDefaults,
    ...(context.recentValues ?? {}),
  }
}

function buildRecentRunPresetName(summary: string, createdAt: string) {
  const base =
    summary
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 32) || "Recent run"

  return `${base} ${createdAt.slice(0, 10)}`
}

export default function SkillRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const locale = useLocale() as "zh" | "en"
  const t = useTranslations("skills.run")
  const ts = useTranslations("skills")
  const tr = useTranslations("agent.risk")
  const tc = useTranslations("common")
  const ta = useTranslations("agent")
  const searchParams = useSearchParams()
  const linkedRunId = searchParams.get("run")
  const [context, setContext] = useState<SkillRunContext | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [analysis, setAnalysis] = useState<AgentAnalysisResult | null>(null)
  const [trajectory, setTrajectory] = useState<AgentTrajectoryStep[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [savingPreset, setSavingPreset] = useState(false)
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null)
  const [savingRecentRunPresetId, setSavingRecentRunPresetId] = useState<string | null>(null)
  const [rerunningRecentRunId, setRerunningRecentRunId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadContext() {
      setLoading(true)
      const result = await getSkillRunContext(id)
      if (cancelled) return

      if (result.success) {
        setContext(result.data)
        const initialValues = buildInitialFieldValues(result.data)
        const linkedRun = linkedRunId
          ? result.data.recentRuns.find((run) => run.id === linkedRunId)
          : null

        setFieldValues(linkedRun ? { ...initialValues, ...linkedRun.values } : initialValues)
        setPresetName("")
        if (linkedRun) {
          toast.success(t("recentRunLoadedFromLink"))
        }
      } else {
        setContext(null)
        toast.error(result.error)
      }

      setLoading(false)
    }

    void loadContext()

    return () => {
      cancelled = true
    }
  }, [id, linkedRunId, t])

  const fieldDefinitions = useMemo<FieldDefinition[]>(() => {
    if (!context) return []

    const placeholderNames = extractPromptVariables(context.entryPromptContent)
    const existingVariables = new Map(
      context.entryPromptVariables.map((variable) => [variable.name, variable])
    )
    const names = new Set<string>([
      ...placeholderNames,
      ...Object.keys(context.skill.inputSchema),
      ...context.entryPromptVariables.map((variable) => variable.name),
    ])

    return Array.from(names).map((name) => {
      const variable = existingVariables.get(name)
      return {
        name,
        description: context.skill.inputSchema[name] || variable?.description || t("fieldDescriptionFallback"),
        defaultValue: variable?.defaultValue || "",
      }
    })
  }, [context, t])

  const renderedPrompt = useMemo(() => {
    if (!context) return ""

    const values = Object.fromEntries(
      fieldDefinitions.map((field) => [
        field.name,
        fieldValues[field.name] ?? field.defaultValue ?? `[${field.name}]`,
      ])
    )

    return renderPromptTemplate(context.entryPromptContent, values, (name) => `[${name}]`)
  }, [context, fieldDefinitions, fieldValues])

  const executeRun = async (
    values: Record<string, string>,
    prompt: string,
    options?: {
      rerunId?: string
      showReplayToast?: boolean
    }
  ) => {
    if (!context || !prompt.trim()) return

    if (options?.rerunId) {
      setRerunningRecentRunId(options.rerunId)
    } else {
      setRunning(true)
    }

    if (options?.showReplayToast) {
      setFieldValues((current) => ({
        ...current,
        ...values,
      }))
    }

    setRunning(true)
    const result = await runStatelessAgentAnalysis(prompt, locale)
    if (result.success) {
      setAnalysis(result.data.analysis)
      setTrajectory(result.data.trajectory)

      const [recentValuesResult, recentRunResult] = await Promise.all([
        saveRecentSkillRunValues(context.skill.id, values),
        saveSkillRunRecord(context.skill.id, values, prompt, result.data.analysis),
      ])

      setContext((current) => {
        if (!current) return current

        return {
          ...current,
          recentValues: recentValuesResult.success ? recentValuesResult.data.values : current.recentValues,
          recentRuns: recentRunResult.success
            ? [recentRunResult.data, ...current.recentRuns].slice(0, 5)
            : current.recentRuns,
        }
      })

      toast.success(options?.rerunId ? t("recentRunRerunComplete") : t("runComplete"))
    } else {
      toast.error(result.error)
    }

    setRunning(false)
    setRerunningRecentRunId(null)
  }

  const handleRun = async () => {
    await executeRun(fieldValues, renderedPrompt)
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(renderedPrompt)
    if (!ok) {
      toast.error(t("copyFailed"))
      return
    }

    toast.success(tc("copied"))
  }

  const handleCopyRecentRunPrompt = async (prompt: string) => {
    const ok = await copyToClipboard(prompt)
    if (!ok) {
      toast.error(t("copyRecentRunPromptFailed"))
      return
    }

    toast.success(t("recentRunPromptCopied"))
  }

  const handleSavePreset = async () => {
    if (!context) return

    setSavingPreset(true)
    const result = await saveSkillRunPreset(context.skill.id, presetName, fieldValues)
    if (result.success) {
      setContext((current) =>
        current
          ? {
              ...current,
              presets: [result.data, ...current.presets].slice(0, 8),
            }
          : current
      )
      setPresetName("")
      toast.success(t("presetSaved"))
    } else {
      toast.error(result.error)
    }
    setSavingPreset(false)
  }

  const applyPreset = (preset: SkillRunPreset) => {
    setFieldValues((current) => ({
      ...current,
      ...preset.values,
    }))
    toast.success(t("presetApplied", { name: preset.name }))
  }

  const restoreRecentValues = () => {
    if (!context?.recentValues) return

    setFieldValues((current) => ({
      ...current,
      ...context.recentValues,
    }))
    toast.success(t("recentRestored"))
  }

  const loadRecentRunValues = (values: Record<string, string>) => {
    setFieldValues((current) => ({
      ...current,
      ...values,
    }))
    toast.success(t("recentRunLoaded"))
  }

  const rerunRecentRun = async (run: SkillRunRecord) => {
    await executeRun(run.values, run.renderedPrompt, {
      rerunId: run.id,
      showReplayToast: true,
    })
  }

  const saveRecentRunAsPreset = async (runId: string, summary: string, createdAt: string, values: Record<string, string>) => {
    if (!context) return

    setSavingRecentRunPresetId(runId)
    const generatedName = buildRecentRunPresetName(summary, createdAt)
    const result = await saveSkillRunPreset(context.skill.id, generatedName, values)

    if (result.success) {
      setContext((current) =>
        current
          ? {
              ...current,
              presets: [result.data, ...current.presets].slice(0, 8),
            }
          : current
      )
      toast.success(t("recentRunPresetSaved", { name: result.data.name }))
    } else {
      toast.error(result.error)
    }

    setSavingRecentRunPresetId(null)
  }

  const handleDeletePreset = async (presetId: string) => {
    if (!context) return

    setDeletingPresetId(presetId)
    const result = await deleteSkillRunPreset(context.skill.id, presetId)
    if (result.success) {
      setContext((current) =>
        current
          ? {
              ...current,
              presets: current.presets.filter((preset) => preset.id !== presetId),
            }
          : current
      )
      toast.success(t("presetDeleted"))
    } else {
      toast.error(result.error)
    }
    setDeletingPresetId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!context) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>{ts("notFound")}</p>
        <Button variant="link" asChild>
          <Link href="/skills">{tc("back")}</Link>
        </Button>
      </div>
    )
  }

  const { skill, latestBenchmark, baselineVersion, health } = context
  const latestRun = context.recentRuns[0] ?? null
  const healthStateVariant = getSkillHealthVariant(health.state)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <>
            <Play className="h-3.5 w-3.5" />
            {t("eyebrow")}
          </>
        }
        title={skill.name}
        description={skill.goal || skill.description || ts("noDescription")}
        actions={
          <>
            <Button variant="ghost" size="sm" asChild className="rounded-2xl">
              <Link href={`/skills/${skill.id}`}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                {tc("back")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-2xl">
              <Link href={skill.entryPrompt.href}>
                <FileText className="mr-1 h-4 w-4" />
                {ts("linkedPrompt")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-2xl">
              <Copy className="mr-1 h-4 w-4" />
              {t("copyRendered")}
            </Button>
            <Button size="sm" onClick={handleRun} disabled={running} className="rounded-2xl">
              <Sparkles className="mr-1 h-4 w-4" />
              {running ? t("running") : t("runAction")}
            </Button>
          </>
        }
      >
        <div className="chip-row">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {skill.recommendedModel}
          </Badge>
          {baselineVersion ? (
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {t("baselineChip", { version: baselineVersion.versionNumber })}
            </Badge>
          ) : null}
          {latestBenchmark ? (
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {t("benchmarkChip", { score: latestBenchmark.overallScore })}
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.85fr)] xl:items-start">
        <div className="space-y-6">
          <section className="app-panel p-6">
            <SectionHeader title={t("inputsTitle")} description={t("inputsDescription")} />
            <div className="mt-5 space-y-4 rounded-[1.75rem] border border-border/60 bg-muted/25 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("presetsTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("presetsDescription")}</p>
                </div>
                {context.recentValues ? (
                  <Button variant="outline" size="sm" onClick={restoreRecentValues} className="rounded-2xl">
                    {t("restoreRecent")}
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="skill-preset-name">{t("presetNameLabel")}</Label>
                  <Input
                    id="skill-preset-name"
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                    placeholder={t("presetNamePlaceholder")}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSavePreset}
                    disabled={savingPreset || !presetName.trim()}
                    className="w-full rounded-2xl md:w-auto"
                  >
                    {savingPreset ? t("savingPreset") : t("savePreset")}
                  </Button>
                </div>
              </div>
              {context.recentValues ? (
                <p className="text-xs text-muted-foreground">{t("recentRestoredHint")}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("noRecentValues")}</p>
              )}
              {context.presets.length > 0 ? (
                <div className="grid gap-2">
                  {context.presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex flex-col gap-3 rounded-[1.25rem] border border-border/60 bg-background/80 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("presetUpdated", { date: formatDate(preset.updatedAt) })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                          className="rounded-2xl"
                        >
                          {t("applyPreset")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePreset(preset.id)}
                          disabled={deletingPresetId === preset.id}
                          className="rounded-2xl text-muted-foreground hover:text-foreground"
                        >
                          {deletingPresetId === preset.id ? t("deletingPreset") : t("deletePreset")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noPresets")}</p>
              )}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {fieldDefinitions.length > 0 ? (
                fieldDefinitions.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={`skill-input-${field.name}`}>{field.name}</Label>
                    <Input
                      id={`skill-input-${field.name}`}
                      value={fieldValues[field.name] ?? field.defaultValue}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      placeholder={field.defaultValue || field.description}
                    />
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noInputs")}</p>
              )}
            </div>
          </section>

          <section className="app-panel p-6">
            <SectionHeader title={t("analysisTitle")} description={t("analysisDescription")} />
            <div className="mt-5">
              <AnalysisPanel
                analysis={analysis}
                trajectory={trajectory}
                analyzing={running}
                analyzingLabel={ta("analyzingWithEngine", { engine: "MiniMax-2.7" })}
              />
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{ts("health.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={healthStateVariant} className="rounded-full px-3 py-1">
                    {ts(`health.states.${health.state}`)}
                  </Badge>
                  {latestBenchmark ? (
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {ts("health.score", { score: latestBenchmark.overallScore })}
                    </Badge>
                  ) : null}
                </div>
                <p className="font-medium text-foreground">{ts(`health.headlines.${health.state}`)}</p>
                <p className="text-muted-foreground">{ts(`health.notes.${health.state}`)}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Target className="h-4 w-4 text-primary" />
                      {ts("health.baselineTitle")}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {baselineVersion
                        ? ts("health.baselineNote", { date: formatDate(baselineVersion.createdAt) })
                        : ts("health.baselineMissing")}
                    </p>
                  </div>
                  <span className="text-right text-sm font-medium">
                    {baselineVersion
                      ? t("baselineChip", { version: baselineVersion.versionNumber })
                      : ts("health.missing")}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Gauge className="h-4 w-4 text-primary" />
                      {ts("health.benchmarkTitle")}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {latestBenchmark
                        ? latestBenchmark.recommendedForProduction
                          ? ts("health.benchmarkRecommended")
                          : ts("health.benchmarkIterate")
                        : ts("health.benchmarkMissing")}
                    </p>
                  </div>
                  <span className="text-right text-sm font-medium">
                    {latestBenchmark ? latestBenchmark.overallScore : ts("health.missing")}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      {ts("health.recentRunTitle")}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {latestRun
                        ? ts("health.recentRunNote", {
                            date: formatDate(latestRun.createdAt),
                            confidence: Math.round(latestRun.confidence * 100),
                          })
                        : ts("health.recentRunMissing")}
                    </p>
                  </div>
                  <span className="text-right text-sm font-medium">
                    {latestRun
                      ? t("recentRunRisk", { level: tr(latestRun.riskLevel) })
                      : ts("health.missing")}
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-xs">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {ts("health.checks.baseline")}
                  </span>
                  <span className="text-muted-foreground">
                    {baselineVersion ? ts("health.checkStates.complete") : ts("health.checkStates.pending")}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-xs">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {ts("health.checks.benchmark")}
                  </span>
                  <span className="text-muted-foreground">
                    {latestBenchmark ? ts("health.checkStates.complete") : ts("health.checkStates.pending")}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-xs">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {ts("health.checks.validation")}
                  </span>
                  <span className="text-muted-foreground">
                    {latestRun ? ts("health.checkStates.complete") : ts("health.checkStates.pending")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("previewTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-[32rem] overflow-y-auto rounded-[1.5rem] border border-border/60 bg-muted/35 p-5">
                <pre className="whitespace-pre-wrap text-sm leading-7">{renderedPrompt}</pre>
              </div>
              <div className="text-xs text-muted-foreground">
                {tc("characters", { count: renderedPrompt.length })} ·{" "}
                {tc("words", {
                  count: Math.max(1, renderedPrompt.trim().split(/\s+/).filter(Boolean).length),
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("outputTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(skill.outputSchema).length > 0 ? (
                Object.entries(skill.outputSchema).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2"
                  >
                    <span className="font-medium">{key}</span>
                    <span className="text-right text-muted-foreground">{value}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">{t("noOutputSchema")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("contextTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("contextPrompt")}</span>
                <span className="text-right">{skill.entryPrompt.title}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("contextBaseline")}</span>
                <span className="text-right">
                  {baselineVersion ? t("baselineChip", { version: baselineVersion.versionNumber }) : t("noBaseline")}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("contextBenchmark")}</span>
                <span className="text-right">
                  {latestBenchmark ? t("benchmarkChip", { score: latestBenchmark.overallScore }) : t("noBenchmark")}
                </span>
              </div>
              {latestBenchmark ? (
                <p className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-muted-foreground">
                  {latestBenchmark.summary}
                </p>
              ) : null}
              {baselineVersion ? (
                <p className="text-xs text-muted-foreground">
                  {t("baselineUpdated", { date: formatDate(baselineVersion.createdAt) })}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("recentRunsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {context.recentRuns.length > 0 ? (
                context.recentRuns.map((run) => (
                  <div
                    key={run.id}
                    className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        {t("recentRunBadge")}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(run.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-6">{run.summary}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
                        {t("recentRunRisk", { level: tr(run.riskLevel) })}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
                        {t("recentRunConfidence", { confidence: Math.round(run.confidence * 100) })}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
                        {t("recentRunInputs", { count: Object.keys(run.values).length })}
                      </Badge>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/70 p-3 text-xs text-muted-foreground">
                      <div className="mb-2 font-medium text-foreground">{t("recentRunPromptPreview")}</div>
                      <p className="line-clamp-4 whitespace-pre-wrap">{run.renderedPrompt}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadRecentRunValues(run.values)}
                        className="rounded-2xl"
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        {t("loadRecentRun")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => saveRecentRunAsPreset(run.id, run.summary, run.createdAt, run.values)}
                        disabled={savingRecentRunPresetId === run.id}
                        className="rounded-2xl"
                      >
                        <BookmarkPlus className="mr-1 h-3.5 w-3.5" />
                        {savingRecentRunPresetId === run.id ? t("savingRecentRunPreset") : t("saveRecentRunAsPreset")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyRecentRunPrompt(run.renderedPrompt)}
                        className="rounded-2xl"
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        {t("copyRecentRunPrompt")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => rerunRecentRun(run)}
                        disabled={running || rerunningRecentRunId === run.id}
                        className="rounded-2xl"
                      >
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                        {rerunningRecentRunId === run.id ? t("rerunningRecentRun") : t("rerunRecentRun")}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">{t("noRecentRuns")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
