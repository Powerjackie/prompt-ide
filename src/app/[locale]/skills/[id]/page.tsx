"use client"

import { use, useEffect, useState, useTransition } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Gauge,
  Layers3,
  Play,
  Pencil,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/layout/section-header"
import { useAuthz } from "@/components/auth/authz-provider"
import { SkillForm } from "@/components/skills/skill-form"
import { attachCollectionToSkill, deleteSkill, getSkillById } from "@/app/actions/skill.actions"
import { getCollections } from "@/app/actions/collection.actions"
import { getPrompts, type SerializedPrompt } from "@/app/actions/prompt.actions"
import { getSkillHealthVariant } from "@/lib/skill-health"
import { copyToClipboard, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Collection } from "@/types/collection"
import type { SkillDetail } from "@/types/skill"

const NO_COLLECTION = "__none__"

export default function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations("skills")
  const tr = useTranslations("agent.risk")
  const tc = useTranslations("common")
  const { canDeleteAssets } = useAuthz()
  const [detail, setDetail] = useState<SkillDetail | null>(null)
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [collectionId, setCollectionId] = useState(NO_COLLECTION)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      const [skillResult, promptResult, collectionResult] = await Promise.all([
        getSkillById(id),
        getPrompts(),
        getCollections(),
      ])

      if (cancelled) return

      if (skillResult.success) {
        setDetail(skillResult.data)
        setCollectionId(skillResult.data.skill.collectionId ?? NO_COLLECTION)
      } else {
        setDetail(null)
        toast.error(skillResult.error)
      }

      if (promptResult.success) {
        setPrompts(promptResult.data)
      }

      if (collectionResult.success) {
        setCollections(collectionResult.data)
      }

      setLoading(false)
    }

    void loadDetail()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>{t("notFound")}</p>
        <Button variant="link" asChild>
          <Link href="/skills">{tc("back")}</Link>
        </Button>
      </div>
    )
  }

  const { skill, latestBenchmark, baselineVersion, recentRuns, health } = detail
  const latestRun = recentRuns[0] ?? null
  const healthStateVariant = getSkillHealthVariant(health.state)

  const handleAttachCollection = () => {
    startTransition(async () => {
      const result = await attachCollectionToSkill(
        skill.id,
        collectionId === NO_COLLECTION ? null : collectionId
      )

      if (!result.success) {
        toast.error(result.error)
        return
      }

      setDetail((current) =>
        current
          ? {
              ...current,
              skill: result.data,
            }
          : current
      )
      toast.success(t("collectionAttached"))
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSkill(skill.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(t("deleted"))
      router.push("/skills")
    })
  }

  const handleCopyRecentRunPrompt = async (prompt: string) => {
    const ok = await copyToClipboard(prompt)
    if (!ok) {
      toast.error(t("copyRecentRunPromptFailed"))
      return
    }

    toast.success(t("recentRunPromptCopied"))
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {t(`status.${skill.status}`)}
          </>
        }
        title={skill.name}
        description={skill.description || skill.goal || t("noDescription")}
        actions={
          <>
            <Button variant="ghost" size="sm" asChild className="rounded-2xl">
              <Link href="/skills">
                <ArrowLeft className="mr-1 h-4 w-4" />
                {tc("back")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => setEditing((value) => !value)}>
              <Pencil className="mr-1 h-4 w-4" />
              {editing ? t("closeEdit") : tc("edit")}
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-2xl">
              <Link href={`/skills/${skill.id}/run`}>
                <Play className="mr-1 h-4 w-4" />
                {t("runAction")}
              </Link>
            </Button>
            {canDeleteAssets ? (
              <AlertDialog>
                <AlertDialogTrigger render={<Button size="sm" variant="destructive" className="rounded-2xl" />}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  {tc("delete")}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>{tc("delete")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </>
        }
      >
        <div className="chip-row">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {skill.recommendedModel}
          </Badge>
          {recentRuns[0] ? (
            <Badge variant="outline" className="rounded-full px-3 py-1">
              <Clock3 className="mr-1 h-3.5 w-3.5" />
              {t("recentRunHeader", { date: formatDate(recentRuns[0].createdAt) })}
            </Badge>
          ) : null}
          {skill.collection ? (
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              <Layers3 className="mr-1 h-3.5 w-3.5" />
              {skill.collection.title}
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-6">
          <section className="app-panel p-6">
            <SectionHeader title={t("health.title")} description={t("health.description")} />
            <div className="mt-5 space-y-5">
              <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-muted/35 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={healthStateVariant} className="rounded-full px-3 py-1">
                      {t(`health.states.${health.state}`)}
                    </Badge>
                    {latestBenchmark ? (
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {t("health.score", { score: latestBenchmark.overallScore })}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-base font-medium text-foreground">{t(`health.headlines.${health.state}`)}</p>
                  <p className="text-sm text-muted-foreground">{t(`health.notes.${health.state}`)}</p>
                </div>
                <Button variant="outline" className="rounded-2xl" asChild>
                  <Link href={`/skills/${skill.id}/run`}>
                    <Play className="mr-1 h-4 w-4" />
                    {t("runAction")}
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4 text-primary" />
                    {t("health.baselineTitle")}
                  </div>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {baselineVersion
                      ? t("benchmarkVersionLabel", { version: baselineVersion.versionNumber })
                      : t("health.missing")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {baselineVersion
                      ? t("health.baselineNote", { date: formatDate(baselineVersion.createdAt) })
                      : t("health.baselineMissing")}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Gauge className="h-4 w-4 text-primary" />
                    {t("health.benchmarkTitle")}
                  </div>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {latestBenchmark ? latestBenchmark.overallScore : t("health.missing")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {latestBenchmark
                      ? latestBenchmark.recommendedForProduction
                        ? t("health.benchmarkRecommended")
                        : t("health.benchmarkIterate")
                      : t("health.benchmarkMissing")}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock3 className="h-4 w-4 text-primary" />
                    {t("health.recentRunTitle")}
                  </div>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {latestRun
                      ? t("recentRunRisk", { level: tr(latestRun.riskLevel) })
                      : t("health.missing")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {latestRun
                      ? t("health.recentRunNote", {
                          date: formatDate(latestRun.createdAt),
                          confidence: Math.round(latestRun.confidence * 100),
                        })
                      : t("health.recentRunMissing")}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {t("health.checks.baseline")}
                  </div>
                  <p>{baselineVersion ? t("health.checkStates.complete") : t("health.checkStates.pending")}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {t("health.checks.benchmark")}
                  </div>
                  <p>{latestBenchmark ? t("health.checkStates.complete") : t("health.checkStates.pending")}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {t("health.checks.validation")}
                  </div>
                  <p>{latestRun ? t("health.checkStates.complete") : t("health.checkStates.pending")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="app-panel p-6">
            <SectionHeader title={t("goal")} description={t("goalDescription")} />
            <div className="mt-4 rounded-[1.5rem] border border-border/60 bg-muted/35 p-5 text-sm leading-7 text-foreground/90">
              {skill.goal || t("noGoal")}
            </div>
          </section>

          <section className="app-panel p-6">
            <SectionHeader title={t("schemaTitle")} description={t("schemaDescription")} />
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <Card className="rounded-[1.5rem] border-border/60 bg-card/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t("inputSchema")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(skill.inputSchema).length > 0 ? (
                    Object.entries(skill.inputSchema).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2">
                        <span className="font-medium">{key}</span>
                        <span className="text-right text-muted-foreground">{value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">{t("schemaEmpty")}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] border-border/60 bg-card/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t("outputSchema")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(skill.outputSchema).length > 0 ? (
                    Object.entries(skill.outputSchema).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2">
                        <span className="font-medium">{key}</span>
                        <span className="text-right text-muted-foreground">{value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">{t("schemaEmpty")}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {editing ? (
            <SkillForm
              prompts={prompts}
              collections={collections}
              initialSkill={skill}
              onCancel={() => setEditing(false)}
              onSaved={(updatedSkill) => {
                setDetail((current) =>
                  current
                    ? {
                        ...current,
                        skill: updatedSkill,
                      }
                    : current
                )
                setCollectionId(updatedSkill.collectionId ?? NO_COLLECTION)
                setEditing(false)
              }}
            />
          ) : null}
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("linkedPrompt")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Link href={skill.entryPrompt.href} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3 hover:border-primary/20 hover:bg-primary/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{skill.entryPrompt.title}</div>
                  <p className="mt-1 text-muted-foreground">
                    {skill.entryPrompt.description || t("noDescription")}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("collectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={collectionId} onValueChange={(value) => setCollectionId(value ?? NO_COLLECTION)}>
                <SelectTrigger className="w-full rounded-2xl">
                  <SelectValue placeholder={t("collectionPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COLLECTION}>{t("noCollection")}</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full rounded-2xl" onClick={handleAttachCollection} disabled={pending}>
                {pending ? t("attaching") : t("attachCollection")}
              </Button>
              {skill.collection ? (
                <Link href={skill.collection.href} className="text-sm text-primary underline-offset-4 hover:underline">
                  {t("openCollection")}
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("benchmarkTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {latestBenchmark ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("benchmarkOverall")}</span>
                    <span className="text-lg font-semibold">{latestBenchmark.overallScore}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("benchmarkVersion")}</span>
                    <span>{t("benchmarkVersionLabel", { version: latestBenchmark.promptVersionNumber })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("benchmarkUpdated")}</span>
                    <span>{formatDate(latestBenchmark.createdAt)}</span>
                  </div>
                  <p className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-muted-foreground">
                    {latestBenchmark.summary}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">{t("noBenchmark")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("recentRunsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentRuns.length > 0 ? (
                recentRuns.slice(0, 3).map((run) => (
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyRecentRunPrompt(run.renderedPrompt)}
                        className="flex-1 rounded-2xl"
                      >
                        <Copy className="mr-1 h-4 w-4" />
                        {t("copyRecentRunPrompt")}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 rounded-2xl" asChild>
                        <Link href={`/skills/${skill.id}/run?run=${run.id}`}>
                          <Play className="mr-1 h-4 w-4" />
                          {t("openRunWithRecent")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">{t("noRecentRuns")}</p>
              )}
              <Button variant="outline" className="w-full rounded-2xl" asChild>
                <Link href={`/skills/${skill.id}/run`}>
                  <Play className="mr-1 h-4 w-4" />
                  {t("runAction")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("baselineTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {baselineVersion ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{t("baselineVersion")}</span>
                    <span>{t("benchmarkVersionLabel", { version: baselineVersion.versionNumber })}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{t("baselineUpdated")}</span>
                    <span>{formatDate(baselineVersion.createdAt)}</span>
                  </div>
                  <p className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-muted-foreground">
                    {baselineVersion.changeSummary || t("baselineSummaryFallback")}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">{t("noBaseline")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("metadata")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("created")}</span>
                <span>{formatDate(skill.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("updated")}</span>
                <span>{formatDate(skill.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
