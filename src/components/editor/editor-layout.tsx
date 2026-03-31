"use client"

import { useState, useRef, useCallback, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Save, Eye, Puzzle, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PromptEditor, extractVariables } from "./prompt-editor"
import { MetadataForm, type MetadataValues } from "./metadata-form"
import { PreviewPanel } from "./preview-panel"
import { ModuleInserter } from "./module-inserter"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { analyzePrompt } from "@/agent"
import {
  getPromptById,
  createPrompt,
  updatePrompt as updatePromptAction,
  getPrompts,
  type SerializedPrompt,
} from "@/app/actions/prompt.actions"
import type { Variable } from "@/types/prompt"
import type { AgentAnalysisResult } from "@/types/agent"
import { toast } from "sonner"

interface EditorLayoutProps {
  promptId?: string
}

function createInitialMeta(prompt?: SerializedPrompt | null): MetadataValues {
  return {
    title: prompt?.title ?? "",
    description: prompt?.description ?? "",
    model: prompt?.model ?? "universal",
    status: prompt?.status ?? "inbox",
    category: prompt?.category ?? "general",
    source: prompt?.source ?? "",
    tags: prompt?.tags ?? [],
    notes: prompt?.notes ?? "",
  }
}

export function EditorLayout({ promptId }: EditorLayoutProps) {
  const tc = useTranslations("common")
  const tp = useTranslations("prompts")
  // Load existing prompt from DB
  const [existing, setExisting] = useState<SerializedPrompt | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(!!promptId)

  useEffect(() => {
    if (!promptId) return
    getPromptById(promptId).then((result) => {
      if (result.success) setExisting(result.data)
      setLoadingExisting(false)
    })
  }, [promptId])

  // Loading state
  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Not found
  if (promptId && !existing) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{tp("notFound")}</p>
        <Button variant="link" asChild>
          <Link href="/prompts">{tc("back")}</Link>
        </Button>
      </div>
    )
  }

  return <EditorForm key={existing?.id ?? "new"} promptId={promptId} existing={existing} />
}

interface EditorFormProps {
  promptId?: string
  existing: SerializedPrompt | null
}

function EditorForm({ promptId, existing }: EditorFormProps) {
  const router = useRouter()
  const t = useTranslations("editor")
  const tc = useTranslations("common")
  const ta = useTranslations("agent")
  const [pending, startTransition] = useTransition()
  const [savedPrompt, setSavedPrompt] = useState(existing)
  const [content, setContent] = useState(existing?.content ?? "")
  const [meta, setMeta] = useState<MetadataValues>(() => createInitialMeta(existing))
  const [dirty, setDirty] = useState(false)
  const [analysis, setAnalysis] = useState<AgentAnalysisResult | null>(
    existing?.agentAnalysis ?? null
  )
  const [analyzing, setAnalyzing] = useState(false)
  const cursorRef = useRef<HTMLTextAreaElement | null>(null)
  const isEdit = !!savedPrompt

  // Track changes
  const handleContentChange = useCallback((v: string) => {
    setContent(v)
    setDirty(true)
  }, [])

  const handleMetaChange = useCallback((v: MetadataValues) => {
    setMeta(v)
    setDirty(true)
  }, [])

  // Build variables from content
  const variables: Variable[] = useMemo(() => {
    const names = extractVariables(content)
    return names.map((name) => {
      const prev = savedPrompt?.variables.find((v) => v.name === name)
      return {
        name,
        description: prev?.description ?? "",
        defaultValue: prev?.defaultValue ?? "",
      }
    })
  }, [content, savedPrompt?.variables])

  // Save handler
  const handleSave = useCallback(() => {
    if (!meta.title.trim()) {
      toast.error(tc("titleRequired"))
      return
    }
    if (!content.trim()) {
      toast.error(tc("contentRequired"))
      return
    }

    startTransition(async () => {
      if (isEdit && promptId) {
        const result = await updatePromptAction(promptId, {
          ...meta,
          content,
          variables,
        })
        if (result.success) {
          setSavedPrompt(result.data)
          toast.success(t("promptUpdated"))
          setDirty(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createPrompt({
          ...meta,
          content,
          variables,
        })
        if (result.success) {
          toast.success(t("promptCreated"))
          router.push(`/prompts/${result.data.id}`)
        } else {
          toast.error(result.error)
        }
      }
    })
  }, [meta, content, variables, isEdit, promptId, router, t, tc, startTransition])

  // Run analysis
  const handleAnalyze = useCallback(async () => {
    if (!content.trim()) {
      toast.error(ta("writeFirst"))
      return
    }
    setAnalyzing(true)
    const allResult = await getPrompts()
    const allPrompts = allResult.success ? allResult.data : []
    setTimeout(() => {
      const result = analyzePrompt({
        content,
        existingPrompts: allPrompts,
        currentId: savedPrompt?.id ?? promptId,
      })
      setAnalysis(result)
      setAnalyzing(false)
      toast.success(ta("analysisComplete"))
    }, 300)
  }, [content, promptId, savedPrompt?.id, ta])

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleSave])

  // Insert module at cursor
  const handleInsertModule = useCallback((moduleContent: string) => {
    const ta = cursorRef.current
    if (!ta) {
      setContent((prev) => prev + "\n\n" + moduleContent)
      setDirty(true)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = content.slice(0, start)
    const after = content.slice(end)
    const separator = before.length > 0 && !before.endsWith("\n") ? "\n\n" : ""
    const newContent = before + separator + moduleContent + after
    setContent(newContent)
    setDirty(true)
    requestAnimationFrame(() => {
      const pos = start + separator.length + moduleContent.length
      ta.setSelectionRange(pos, pos)
      ta.focus()
    })
  }, [content])

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={isEdit ? `/prompts/${promptId}` : "/prompts"}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {tc("back")}
            </Link>
          </Button>
          <h1 className="text-xl font-bold">
            {isEdit ? t("editPrompt") : t("newPrompt")}
          </h1>
          {dirty && (
            <span className="text-xs text-muted-foreground">{tc("unsavedChanges")}</span>
          )}
        </div>
        <Button onClick={handleSave} disabled={pending}>
          <Save className="h-4 w-4 mr-1" /> {isEdit ? tc("save") : tc("create")}
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Metadata + Editor */}
        <div className="space-y-4">
          <MetadataForm values={meta} onChange={handleMetaChange} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("contentLabel")}</label>
            <PromptEditor
              value={content}
              onChange={handleContentChange}
              cursorRef={cursorRef}
            />
          </div>
        </div>

        {/* Right: Preview / Agent / Modules tabs */}
        <div>
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">
                <Eye className="h-3.5 w-3.5 mr-1" /> {t("preview")}
              </TabsTrigger>
              <TabsTrigger value="agent">
                <Bot className="h-3.5 w-3.5 mr-1" /> Agent
              </TabsTrigger>
              <TabsTrigger value="modules">
                <Puzzle className="h-3.5 w-3.5 mr-1" /> {t("modules")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4">
              <PreviewPanel content={content} variables={variables} />
            </TabsContent>
            <TabsContent value="agent" className="mt-4">
              <AnalysisPanel
                analysis={analysis}
                onAnalyze={handleAnalyze}
                analyzing={analyzing}
              />
            </TabsContent>
            <TabsContent value="modules" className="mt-4">
              <ModuleInserter onInsert={handleInsertModule} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
