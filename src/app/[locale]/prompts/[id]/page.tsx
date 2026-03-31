"use client"

import { use, useState, useEffect, useCallback, useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  Copy,
  Star,
  PenSquare,
  Archive,
  Trash2,
  RotateCcw,
  ClipboardCopy,
  ArrowUpRight,
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
  getPromptById,
  toggleFavorite,
  setPromptStatus,
  deletePrompt as deletePromptAction,
  clonePrompt,
  setPromptAnalysis,
  markPromptLastUsed,
  type SerializedPrompt,
} from "@/app/actions/prompt.actions"
import { getPrompts } from "@/app/actions/prompt.actions"
import { MODEL_OPTIONS, STATUS_OPTIONS } from "@/lib/constants"
import { cn, formatDate, copyToClipboard } from "@/lib/utils"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { analyzePrompt } from "@/agent"
import { toast } from "sonner"

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations("prompts")
  const tc = useTranslations("common")
  const ta = useTranslations("agent")
  const th = useTranslations("home")

  const [prompt, setPrompt] = useState<SerializedPrompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [pending, startTransition] = useTransition()

  // Fetch prompt from DB
  useEffect(() => {
    getPromptById(id).then((result) => {
      if (result.success) setPrompt(result.data)
      setLoading(false)
    })
  }, [id])

  const handleAnalyze = useCallback(async () => {
    if (!prompt) return
    setAnalyzing(true)
    // Get all prompts for similarity check
    const allResult = await getPrompts()
    const allPrompts = allResult.success ? allResult.data : []
    setTimeout(async () => {
      const result = analyzePrompt({
        content: prompt.content,
        existingPrompts: allPrompts,
        currentId: prompt.id,
      })
      const updated = await setPromptAnalysis(prompt.id, result)
      if (updated.success) setPrompt(updated.data)
      setAnalyzing(false)
      toast.success(ta("analysisComplete"))
    }, 300)
  }, [prompt, ta])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Button variant="link" asChild><Link href="/prompts">{tc("back")}</Link></Button>
      </div>
    )
  }

  const modelLabel = MODEL_OPTIONS.find((m) => m.value === prompt.model)?.label ?? prompt.model
  const statusOption = STATUS_OPTIONS.find((s) => s.value === prompt.status)

  const handleCopy = async () => {
    await copyToClipboard(prompt.content)
    startTransition(async () => {
      const result = await markPromptLastUsed(prompt.id)
      if (result.success) setPrompt(result.data)
    })
    toast.success(tc("copied"))
  }

  const handleClone = () => {
    startTransition(async () => {
      const result = await clonePrompt(prompt.id)
      if (result.success) {
        toast.success(tc("cloned"))
        router.push(`/editor/${result.data.id}`)
      }
    })
  }

  const handleToggleFavorite = () => {
    startTransition(async () => {
      const result = await toggleFavorite(prompt.id)
      if (result.success) setPrompt(result.data)
    })
  }

  const handlePromote = () => {
    startTransition(async () => {
      const result = await setPromptStatus(prompt.id, "production")
      if (result.success) {
        setPrompt(result.data)
        toast.success(tc("promoted"))
      }
    })
  }

  const handleArchive = () => {
    startTransition(async () => {
      const result = await setPromptStatus(prompt.id, "archived")
      if (result.success) {
        setPrompt(result.data)
        toast.success(tc("archived"))
      }
    })
  }

  const handleRestore = () => {
    startTransition(async () => {
      const result = await setPromptStatus(prompt.id, "production")
      if (result.success) {
        setPrompt(result.data)
        toast.success(tc("restored"))
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePromptAction(prompt.id)
      if (result.success) {
        router.push("/prompts")
        toast.success(tc("deleted"))
      }
    })
  }

  return (
    <div className={cn("space-y-6 max-w-5xl", pending && "opacity-70 pointer-events-none")}>
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/prompts"><ArrowLeft className="h-4 w-4 mr-1" /> {tc("back")}</Link>
        </Button>
        <div className="flex items-center gap-2">
          {prompt.status === "inbox" && (
            <Button size="sm" onClick={handlePromote}>
              <ArrowUpRight className="h-4 w-4 mr-1" /> {tc("promote")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" /> {tc("copy")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFavorite}
          >
            <Star className={cn("h-4 w-4 mr-1", prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "")} />
            {prompt.isFavorite ? tc("unfavorite") : tc("favorite")}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/editor/${prompt.id}`}><PenSquare className="h-4 w-4 mr-1" /> {tc("edit")}</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleClone}>
            <ClipboardCopy className="h-4 w-4 mr-1" /> {tc("clone")}
          </Button>
          {prompt.status !== "archived" ? (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-1" /> {tc("archive")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleRestore}>
              <RotateCcw className="h-4 w-4 mr-1" /> {tc("restore")}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="destructive" size="sm" />}
            >
              <Trash2 className="h-4 w-4 mr-1" /> {tc("delete")}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("deleteConfirmDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {tc("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-muted-foreground mt-1">{prompt.description}</p>
            )}
          </div>

          {/* Content */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{t("promptContent")}</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5 mr-1" /> {tc("copy")}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/50 rounded-md p-4 max-h-96 overflow-y-auto">
                {prompt.content}
              </pre>
            </CardContent>
          </Card>

          {/* Variables */}
          {prompt.variables.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("variables")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                    <div>Name</div>
                    <div>Description</div>
                    <div>Default</div>
                  </div>
                  {prompt.variables.map((v) => (
                    <div key={v.name} className="grid grid-cols-3 gap-4 px-4 py-2 border-t text-sm">
                      <div className="font-mono text-xs">{`{{${v.name}}}`}</div>
                      <div className="text-muted-foreground">{v.description || "—"}</div>
                      <div className="text-muted-foreground">{v.defaultValue || "—"}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
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
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("metadata")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("status")}</span>
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-block h-2 w-2 rounded-full", statusOption?.color)} />
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
                <span>{prompt.source || "—"}</span>
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

          {/* Tags */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{th("tags")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.length > 0 ? (
                  prompt.tags.map((tag) => (
                    <Link key={tag} href={`/prompts?tag=${tag}`}>
                      <Badge variant="secondary" className="cursor-pointer">{tag}</Badge>
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">{t("noTags")}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{ta("title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisPanel
                analysis={prompt.agentAnalysis}
                onAnalyze={handleAnalyze}
                analyzing={analyzing}
                compact
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
