"use client"

import { use, useCallback, useEffect, useState, useTransition } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  ClipboardCopy,
  Copy,
  Layers3,
  MoreHorizontal,
  PenSquare,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/layout/section-header"
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
import {
  clonePrompt,
  deletePrompt as deletePromptAction,
  setPromptStatus,
  type SerializedPrompt,
} from "@/app/actions/prompt.actions"
import {
  getPromptById,
  markPromptLastUsed,
  toggleFavorite,
} from "@/app/actions/prompt-surface.actions"
import { runAgentAnalysis } from "@/app/actions/agent.actions"
import { getHistoryByPromptId } from "@/app/actions/agent-history.actions"
import { getPromptVersionsByPromptId } from "@/app/actions/prompt-version.actions"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { RefactorPanel } from "@/components/agent/refactor-panel"
import { BenchmarkPanel } from "@/components/prompts/benchmark-panel"
import { VersionHistoryPanel } from "@/components/prompts/version-history-panel"
import { useAuthz } from "@/components/auth/authz-provider"
import { getLatestPromptEvolutionComparison } from "@/app/actions/benchmark.actions"
import { createSkillFromPrompt } from "@/app/actions/skill.actions"
import { STATUS_OPTIONS } from "@/lib/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, copyToClipboard, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { AgentTrajectoryStep } from "@/types/agent"
import type { PromptEvolutionComparison } from "@/types/benchmark"
import type { PromptVersion, PromptVersionSnapshot } from "@/types/prompt-version"

function createPromptSnapshot(prompt: SerializedPrompt): PromptVersionSnapshot {
  return {
    title: prompt.title,
    description: prompt.description,
    content: prompt.content,
    status: prompt.status,
    source: prompt.source,
    model: prompt.model,
    category: prompt.category,
    tags: prompt.tags,
    notes: prompt.notes,
    variables: prompt.variables,
  }
}

export default function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const locale = useLocale() as "zh" | "en"
  const t = useTranslations("prompts")
  const tc = useTranslations("common")
  const ta = useTranslations("agent")
  const tm = useTranslations("models")
  const ts = useTranslations("status")
  const { canDeleteAssets } = useAuthz()

  const [prompt, setPrompt] = useState<SerializedPrompt | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [trajectory, setTrajectory] = useState<AgentTrajectoryStep[] | null>(null)
  const [evolutionComparison, setEvolutionComparison] = useState<PromptEvolutionComparison | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [trajectoryLoading, setTrajectoryLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [pending, startTransition] = useTransition()

  const refreshVersions = useCallback(async () => {
    const [versionsResult, evolutionResult] = await Promise.all([
      getPromptVersionsByPromptId(id),
      getLatestPromptEvolutionComparison(id, "auto", locale),
    ])

    if (versionsResult.success) {
      setVersions(versionsResult.data)
    } else {
      toast.error(versionsResult.error)
    }

    if (evolutionResult.success) {
      setEvolutionComparison(evolutionResult.data)
    } else {
      toast.error(evolutionResult.error)
    }
  }, [id, locale])

  useEffect(() => {
    let cancelled = false

    async function loadPromptPage() {
      setLoading(true)
      setTrajectoryLoading(true)

      const [promptResult, historyResult, versionsResult, evolutionResult] = await Promise.all([
        getPromptById(id),
        getHistoryByPromptId(id, "react_trajectory"),
        getPromptVersionsByPromptId(id),
        getLatestPromptEvolutionComparison(id, "auto", locale),
      ])

      if (cancelled) return

      if (promptResult.success) {
        setPrompt(promptResult.data)
      } else {
        setPrompt(null)
      }

      if (
        promptResult.success &&
        promptResult.data.agentAnalysis &&
        !promptResult.data.needsReanalysis &&
        historyResult.success
      ) {
        setTrajectory(historyResult.data[0]?.trajectory ?? null)
      } else {
        setTrajectory(null)
      }

      if (versionsResult.success) {
        setVersions(versionsResult.data)
      } else {
        setVersions([])
      }

      if (evolutionResult.success) {
        setEvolutionComparison(evolutionResult.data)
      } else {
        setEvolutionComparison(null)
      }

      setLoading(false)
      setTrajectoryLoading(false)
    }

    void loadPromptPage()

    return () => {
      cancelled = true
    }
  }, [id, locale])

  const handleAnalyze = useCallback(async () => {
    if (!prompt) return

    setAnalyzing(true)
    startTransition(async () => {
      const result = await runAgentAnalysis(prompt.content, prompt.id, locale)
      if (result.success) {
        setTrajectory(result.data.trajectory)
        setPrompt((current) =>
          current
            ? {
                ...current,
                agentAnalysis: result.data.analysis,
                lastAnalyzedAt: result.data.analysis.analyzedAt,
                agentVersion: result.data.analysis.analysisVersion,
                needsReanalysis: false,
              }
            : current
        )
        toast.success(ta("analysisComplete"))
      } else {
        toast.error(result.error)
      }

      setAnalyzing(false)
    })
  }, [locale, prompt, startTransition, ta])

  const handleRefactorApplied = useCallback(
    (updatedPrompt: SerializedPrompt) => {
      setPrompt(updatedPrompt)
      setTrajectory(null)
      void refreshVersions()
    },
    [refreshVersions]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Button variant="link" asChild>
          <Link href="/prompts">{tc("back")}</Link>
        </Button>
      </div>
    )
  }

  const modelLabel = tm(prompt.model)
  const statusOption = STATUS_OPTIONS.find((status) => status.value === prompt.status)
  const currentSnapshot = createPromptSnapshot(prompt)
  const sectionLinks = [
    { id: "overview", label: t("metadata") },
    { id: "content", label: t("promptContent") },
    ...(prompt.variables.length > 0 ? [{ id: "variables", label: t("variables") }] : []),
    ...(prompt.notes ? [{ id: "notes", label: t("notes") }] : []),
    { id: "versions", label: t("versions.title") },
    { id: "benchmark", label: t("detailBenchmarkTitle") },
    { id: "agent", label: ta("title") },
  ]

  const handleCopy = async () => {
    const ok = await copyToClipboard(prompt.content)
    if (!ok) {
      toast.error(tc("copyFailed"))
      return
    }

    startTransition(async () => {
      const result = await markPromptLastUsed(prompt.id)
      if (result.success) {
        setPrompt(result.data)
      } else {
        toast.error(result.error)
      }
    })

    toast.success(tc("copied"))
  }

  const handleClone = () => {
    startTransition(async () => {
      const result = await clonePrompt(prompt.id)
      if (result.success) {
        toast.success(tc("cloned"))
        router.push(`/editor/${result.data.id}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleCreateSkill = () => {
    startTransition(async () => {
      const result = await createSkillFromPrompt(prompt.id)
      if (result.success) {
        toast.success(ta("skillCreated"))
        router.push(`/skills/${result.data.id}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleToggleFavorite = () => {
    startTransition(async () => {
      const result = await toggleFavorite(prompt.id)
      if (result.success) {
        setPrompt(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handlePromote = () => {
    startTransition(async () => {
      const result = await setPromptStatus(prompt.id, "production")
      if (result.success) {
        setPrompt(result.data)
        toast.success(tc("promoted"))
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleArchive = () => {
    startTransition(async () => {
      const result = await setPromptStatus(prompt.id, "archived")
      if (result.success) {
        setPrompt(result.data)
        toast.success(tc("archived"))
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleRestoreStatus = () => {
    startTransition(async () => {
      const result = await setPromptStatus(prompt.id, "production")
      if (result.success) {
        setPrompt(result.data)
        toast.success(tc("restored"))
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePromptAction(prompt.id)
      if (result.success) {
        router.push("/prompts")
        toast.success(tc("deleted"))
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className={cn("space-y-8", pending && "pointer-events-none opacity-70")}>
      <PageHeader
        eyebrow={
          <>
            <ArrowUpRight className="h-3.5 w-3.5" />
            {statusOption ? ts(statusOption.value) : prompt.status}
          </>
        }
        title={prompt.title}
        description={prompt.description || t("detailDescription")}
        actions={
          <>
            <div className="flex w-full items-center gap-2 sm:hidden">
              <Button variant="ghost" size="sm" asChild className="rounded-2xl">
                <Link href="/prompts">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  {tc("back")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-2xl">
                <Copy className="mr-1 h-4 w-4" />
                {tc("copy")}
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-2xl">
                <Link href={`/editor/${prompt.id}`}>
                  <PenSquare className="mr-1 h-4 w-4" />
                  {tc("edit")}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="ml-auto h-9 w-9 rounded-2xl" />}>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {prompt.status === "inbox" ? (
                    <DropdownMenuItem onClick={handlePromote}>
                      <ArrowUpRight className="h-4 w-4" />
                      {tc("promote")}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={handleToggleFavorite}>
                    <Star className={cn("h-4 w-4", prompt.isFavorite && "fill-yellow-400 text-yellow-400")} />
                    {prompt.isFavorite ? tc("unfavorite") : tc("favorite")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClone}>
                    <ClipboardCopy className="h-4 w-4" />
                    {tc("clone")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreateSkill}>
                    <Layers3 className="h-4 w-4" />
                    {ta("createSkill")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {prompt.status !== "archived" ? (
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive className="h-4 w-4" />
                      {tc("archive")}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleRestoreStatus}>
                      <RotateCcw className="h-4 w-4" />
                      {tc("restore")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
              <Button variant="ghost" size="sm" asChild className="rounded-2xl">
                <Link href="/prompts">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  {tc("back")}
                </Link>
              </Button>
              {prompt.status === "inbox" ? (
                <Button size="sm" onClick={handlePromote} className="rounded-2xl">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  {tc("promote")}
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-2xl">
                <Copy className="mr-1 h-4 w-4" />
                {tc("copy")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleToggleFavorite} className="rounded-2xl">
                <Star
                  className={cn(
                    "mr-1 h-4 w-4",
                    prompt.isFavorite && "fill-yellow-400 text-yellow-400"
                  )}
                />
                {prompt.isFavorite ? tc("unfavorite") : tc("favorite")}
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-2xl">
                <Link href={`/editor/${prompt.id}`}>
                  <PenSquare className="mr-1 h-4 w-4" />
                  {tc("edit")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleClone} className="rounded-2xl">
                <ClipboardCopy className="mr-1 h-4 w-4" />
                {tc("clone")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreateSkill} className="rounded-2xl">
                <Layers3 className="mr-1 h-4 w-4" />
                {ta("createSkill")}
              </Button>
              {prompt.status !== "archived" ? (
                <Button variant="outline" size="sm" onClick={handleArchive} className="rounded-2xl">
                  <Archive className="mr-1 h-4 w-4" />
                  {tc("archive")}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleRestoreStatus} className="rounded-2xl">
                  <RotateCcw className="mr-1 h-4 w-4" />
                  {tc("restore")}
                </Button>
              )}
              {canDeleteAssets ? (
                <AlertDialog>
                  <AlertDialogTrigger render={<Button size="sm" variant="destructive" className="rounded-2xl" />}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    {tc("delete")}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("deleteConfirmDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>{tc("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          </>
        }
      >
        <div className="space-y-3">
          <div className="chip-row">
            <Badge variant="outline" className="rounded-full px-3 py-1">{modelLabel}</Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">{prompt.category}</Badge>
            {prompt.tags.slice(0, 4).map((tag) => (
              <Link key={tag} href={`/prompts?tag=${tag}`}>
                <Badge variant="secondary" className="rounded-full px-3 py-1">{tag}</Badge>
              </Link>
            ))}
          </div>
          <div className="chip-row">
            {sectionLinks.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/20 hover:text-foreground"
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="order-2 space-y-6 xl:order-1">
          <Card id="content" className="app-panel scroll-mt-24">
            <CardHeader className="flex flex-col items-start gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm">{t("promptContent")}</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="rounded-2xl">
                <Copy className="mr-1 h-3.5 w-3.5" />
                {tc("copy")}
              </Button>
            </CardHeader>
            <CardContent>
                    <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-[1.5rem] border border-border/60 bg-muted/40 p-4 font-mono text-sm leading-7 sm:p-5 dark:border-primary/12">
                {prompt.content}
              </pre>
            </CardContent>
          </Card>

          {prompt.variables.length > 0 && (
            <Card id="variables" className="app-panel scroll-mt-24">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("variables")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
                  <div className="hidden grid-cols-3 gap-4 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
                    <div>{t("variablesHeaders.name")}</div>
                    <div>{t("variablesHeaders.description")}</div>
                    <div>{t("variablesHeaders.default")}</div>
                  </div>
                  {prompt.variables.map((variable) => (
                    <div
                      key={variable.name}
                      className="grid gap-2 border-t px-4 py-3 text-sm sm:grid-cols-3 sm:gap-4 sm:py-2"
                    >
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:hidden">
                          {t("variablesHeaders.name")}
                        </div>
                        <div className="font-mono text-xs break-all">{`{{${variable.name}}}`}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:hidden">
                          {t("variablesHeaders.description")}
                        </div>
                        <div className="text-muted-foreground break-words">{variable.description || "-"}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:hidden">
                          {t("variablesHeaders.default")}
                        </div>
                        <div className="text-muted-foreground break-words">{variable.defaultValue || "-"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {prompt.notes && (
            <Card id="notes" className="app-panel scroll-mt-24">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground break-words">{prompt.notes}</p>
              </CardContent>
            </Card>
          )}

          <section id="versions" className="app-panel scroll-mt-24 p-4 sm:p-6">
            <SectionHeader
              title={t("versions.title")}
              description={t("detailVersionsDescription")}
            />
            <div className="mt-5">
              <VersionHistoryPanel
                promptId={prompt.id}
                currentSnapshot={currentSnapshot}
                refreshKey={prompt.updatedAt}
                onRestore={(restoredPrompt) => {
                  setPrompt(restoredPrompt)
                  setTrajectory(null)
                  void refreshVersions()
                }}
              />
            </div>
          </section>

          <section id="benchmark" className="app-panel scroll-mt-24 p-4 sm:p-6">
            <SectionHeader
              title={t("detailBenchmarkTitle")}
              description={t("detailBenchmarkDescription")}
            />
            <div className="mt-5">
              <BenchmarkPanel
                promptId={prompt.id}
                latestVersion={versions[0] ?? null}
                versions={versions}
                evolutionComparison={evolutionComparison}
              />
            </div>
          </section>

          <section id="agent" className="app-panel scroll-mt-24 p-4 sm:p-6">
            <SectionHeader
              title={ta("title")}
              description={t("detailAgentDescription")}
            />
            <div className="mt-5">
              <Tabs defaultValue="analysis" className="space-y-4">
                <TabsList variant="line" className="flex h-auto flex-wrap justify-start rounded-2xl bg-muted/45 p-1 dark:border dark:border-primary/10 dark:bg-background/60">
                  <TabsTrigger value="analysis">{ta("modes.analysis")}</TabsTrigger>
                  <TabsTrigger value="refactor">{ta("modes.refactor")}</TabsTrigger>
                </TabsList>
                <TabsContent value="analysis" className="mt-0">
                  <AnalysisPanel
                    analysis={prompt.agentAnalysis}
                    trajectory={trajectory}
                    trajectoryLoading={trajectoryLoading}
                    onAnalyze={handleAnalyze}
                    analyzing={analyzing}
                    analyzingLabel={ta("analyzingWithEngine", { engine: "MiniMax-2.7" })}
                  />
                </TabsContent>
                <TabsContent value="refactor" className="mt-0">
                  <RefactorPanel
                    promptId={prompt.id}
                    promptContent={prompt.content}
                    currentDraft={{
                      title: prompt.title,
                      description: prompt.description,
                      content: prompt.content,
                      tags: prompt.tags,
                    }}
                    refreshKey={prompt.updatedAt}
                    onPromptApplied={handleRefactorApplied}
                    onEvolutionComparisonReady={setEvolutionComparison}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </div>

        <div className="order-1 space-y-4 xl:order-2 xl:sticky xl:top-6 xl:self-start">
          <Card id="overview" className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("metadata")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">{t("status")}</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn("inline-block h-2 w-2 rounded-full", statusOption?.color)}
                  />
                  <span>{statusOption ? ts(statusOption.value) : prompt.status}</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">{t("model")}</span>
                <span className="break-words text-right">{modelLabel}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">{t("category")}</span>
                <span className="break-words text-right">{prompt.category}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">{t("source")}</span>
                <span className="break-words text-right">{prompt.source || "-"}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">{t("created")}</span>
                <span className="text-right">{formatDate(prompt.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">{t("updated")}</span>
                <span className="text-right">{formatDate(prompt.updatedAt)}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">{t("lastUsed")}</span>
                <span className="text-right">{prompt.lastUsedAt ? formatDate(prompt.lastUsedAt) : t("never")}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="app-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("versions.fields.tags")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.length > 0 ? (
                  prompt.tags.map((tag) => (
                    <Link key={tag} href={`/prompts?tag=${tag}`}>
                      <Badge variant="secondary" className="cursor-pointer dark:bg-primary/10 dark:text-primary">
                        {tag}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">{t("noTags")}</span>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
