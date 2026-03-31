"use client"

import { use, useCallback, useEffect, useState, useTransition } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  ClipboardCopy,
  Copy,
  PenSquare,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  getPromptById,
  markPromptLastUsed,
  setPromptStatus,
  toggleFavorite,
  type SerializedPrompt,
} from "@/app/actions/prompt.actions"
import { runAgentAnalysis } from "@/app/actions/agent.actions"
import { getHistoryByPromptId } from "@/app/actions/agent-history.actions"
import { getPromptVersionsByPromptId } from "@/app/actions/prompt-version.actions"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { BenchmarkPanel } from "@/components/prompts/benchmark-panel"
import { VersionHistoryPanel } from "@/components/prompts/version-history-panel"
import { MODEL_OPTIONS, STATUS_OPTIONS } from "@/lib/constants"
import { cn, copyToClipboard, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { AgentTrajectoryStep } from "@/types/agent"
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
  const t = useTranslations("prompts")
  const tc = useTranslations("common")
  const ta = useTranslations("agent")
  const th = useTranslations("home")

  const [prompt, setPrompt] = useState<SerializedPrompt | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [trajectory, setTrajectory] = useState<AgentTrajectoryStep[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [trajectoryLoading, setTrajectoryLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [pending, startTransition] = useTransition()

  const refreshVersions = useCallback(async () => {
    const result = await getPromptVersionsByPromptId(id)
    if (result.success) {
      setVersions(result.data)
    } else {
      toast.error(result.error)
    }
  }, [id])

  useEffect(() => {
    let cancelled = false

    async function loadPromptPage() {
      setLoading(true)
      setTrajectoryLoading(true)

      const [promptResult, historyResult, versionsResult] = await Promise.all([
        getPromptById(id),
        getHistoryByPromptId(id),
        getPromptVersionsByPromptId(id),
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

      setLoading(false)
      setTrajectoryLoading(false)
    }

    void loadPromptPage()

    return () => {
      cancelled = true
    }
  }, [id])

  const handleAnalyze = useCallback(async () => {
    if (!prompt) return

    setAnalyzing(true)
    startTransition(async () => {
      const result = await runAgentAnalysis(prompt.content, prompt.id)
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
  }, [prompt, startTransition, ta])

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

  const modelLabel = MODEL_OPTIONS.find((model) => model.value === prompt.model)?.label ?? prompt.model
  const statusOption = STATUS_OPTIONS.find((status) => status.value === prompt.status)
  const currentSnapshot = createPromptSnapshot(prompt)

  const handleCopy = async () => {
    const ok = await copyToClipboard(prompt.content)
    if (!ok) {
      toast.error("Failed to copy")
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
    <div className={cn("max-w-5xl space-y-6", pending && "pointer-events-none opacity-70")}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/prompts">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {tc("back")}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {prompt.status === "inbox" && (
            <Button size="sm" onClick={handlePromote}>
              <ArrowUpRight className="mr-1 h-4 w-4" />
              {tc("promote")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-1 h-4 w-4" />
            {tc("copy")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleFavorite}>
            <Star
              className={cn(
                "mr-1 h-4 w-4",
                prompt.isFavorite && "fill-yellow-400 text-yellow-400"
              )}
            />
            {prompt.isFavorite ? tc("unfavorite") : tc("favorite")}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/editor/${prompt.id}`}>
              <PenSquare className="mr-1 h-4 w-4" />
              {tc("edit")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleClone}>
            <ClipboardCopy className="mr-1 h-4 w-4" />
            {tc("clone")}
          </Button>
          {prompt.status !== "archived" ? (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="mr-1 h-4 w-4" />
              {tc("archive")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleRestoreStatus}>
              <RotateCcw className="mr-1 h-4 w-4" />
              {tc("restore")}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{prompt.title}</h1>
            {prompt.description && (
              <p className="mt-1 text-muted-foreground">{prompt.description}</p>
            )}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{t("promptContent")}</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="mr-1 h-3.5 w-3.5" />
                {tc("copy")}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/50 p-4 font-mono text-sm">
                {prompt.content}
              </pre>
            </CardContent>
          </Card>

          {prompt.variables.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("variables")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 gap-4 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <div>Name</div>
                    <div>Description</div>
                    <div>Default</div>
                  </div>
                  {prompt.variables.map((variable) => (
                    <div
                      key={variable.name}
                      className="grid grid-cols-3 gap-4 border-t px-4 py-2 text-sm"
                    >
                      <div className="font-mono text-xs">{`{{${variable.name}}}`}</div>
                      <div className="text-muted-foreground">{variable.description || "-"}</div>
                      <div className="text-muted-foreground">{variable.defaultValue || "-"}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {prompt.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{prompt.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <BenchmarkPanel
                promptId={prompt.id}
                latestVersion={versions[0] ?? null}
                versions={versions}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("metadata")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("status")}</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn("inline-block h-2 w-2 rounded-full", statusOption?.color)}
                  />
                  <span>{statusOption?.label}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("model")}</span>
                <span>{modelLabel}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("category")}</span>
                <span>{prompt.category}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("source")}</span>
                <span>{prompt.source || "-"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("created")}</span>
                <span>{formatDate(prompt.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("updated")}</span>
                <span>{formatDate(prompt.updatedAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("lastUsed")}</span>
                <span>{prompt.lastUsedAt ? formatDate(prompt.lastUsedAt) : t("never")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{th("tags")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.length > 0 ? (
                  prompt.tags.map((tag) => (
                    <Link key={tag} href={`/prompts?tag=${tag}`}>
                      <Badge variant="secondary" className="cursor-pointer">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{ta("title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisPanel
                analysis={prompt.agentAnalysis}
                trajectory={trajectory}
                trajectoryLoading={trajectoryLoading}
                onAnalyze={handleAnalyze}
                analyzing={analyzing}
                compact
                analyzingLabel={ta("analyzingWithEngine", { engine: "MiniMax-2.7" })}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
