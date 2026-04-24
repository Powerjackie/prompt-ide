"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Code2, FlaskConical, Headset, Languages, PenTool, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { runStatelessAgentAnalysis } from "@/app/actions/agent.actions"
import { getEffectiveSettings } from "@/app/actions/settings.actions"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Folio } from "@/components/ui/folio"
import { PageHeader } from "@/components/ui/page-header"
import { PageShell } from "@/components/ui/page-shell"
import { SurfaceCard } from "@/components/ui/surface-card"
import { Textarea } from "@/components/ui/textarea"
import type { AgentAnalysisResult, AgentTrajectoryStep } from "@/types/agent"

type PlaygroundTemplate = {
  id: string
  icon: typeof PenTool
  title: string
  description: string
  content: string
}

export default function PlaygroundPage() {
  const locale = useLocale()
  const t = useTranslations("playground")
  const ta = useTranslations("agent")
  const [content, setContent] = useState("")
  const [analysis, setAnalysis] = useState<AgentAnalysisResult | null>(null)
  const [trajectory, setTrajectory] = useState<AgentTrajectoryStep[] | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [agentEnabled, setAgentEnabled] = useState(true)

  const isZh = locale.startsWith("zh")
  const copy = isZh
    ? {
        eyebrow: "stateless analysis floor",
        title: "Playground",
        intro: "把原始提示词放进工作台，先看结构、变量和风险，再决定它要不要进入正式界面。",
        brief: "无状态分析现场。输入、运行、读取、清空，动作短，反馈硬。",
        textarea: "Prompt 原文",
        run: "运行分析",
        clear: "清空",
        templates: "模板入口",
        console: "分析记录",
        disabled: "Agent 分析已关闭",
      }
    : {
        eyebrow: "stateless analysis floor",
        title: "Playground",
        intro:
          "Drop raw prompt text into the workspace, read structure, variables, and risk first, then decide if it deserves product surface.",
        brief: "A stateless analysis floor: input, run, read, clear.",
        textarea: "Prompt source",
        run: "Run analysis",
        clear: "Clear",
        templates: "Template feed",
        console: "Analysis record",
        disabled: "Agent analysis is disabled",
      }

  useEffect(() => {
    let active = true
    void getEffectiveSettings().then((result) => {
      if (!active) return
      if (result.success) setAgentEnabled(result.data.agent.enabled)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    document.title = "Playground | Prompt IDE"
  }, [])

  const templates = useMemo<PlaygroundTemplate[]>(
    () => [
      {
        id: "writing",
        icon: PenTool,
        title: t("templates.writing.title"),
        description: t("templates.writing.description"),
        content: t.raw("templates.writing.content") as string,
      },
      {
        id: "translation",
        icon: Languages,
        title: t("templates.translation.title"),
        description: t("templates.translation.description"),
        content: t.raw("templates.translation.content") as string,
      },
      {
        id: "support",
        icon: Headset,
        title: t("templates.support.title"),
        description: t("templates.support.description"),
        content: t.raw("templates.support.content") as string,
      },
      {
        id: "code",
        icon: Code2,
        title: t("templates.code.title"),
        description: t("templates.code.description"),
        content: t.raw("templates.code.content") as string,
      },
    ],
    [t]
  )

  const variableCount = useMemo(() => {
    const names = new Set<string>()
    for (const match of content.matchAll(/\{\{\s*([\w.-]+)\s*\}\}|\{([A-Za-z_][\w.-]*)\}|\$\{([A-Za-z_][\w.-]*)\}/g)) {
      const name = match[1] ?? match[2] ?? match[3]
      if (name) names.add(name)
    }
    return names.size
  }, [content])

  const handleMobileFocus = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element || typeof window === "undefined") return
    if (!window.matchMedia("(max-width: 767px)").matches) return
    requestAnimationFrame(() => {
      element.scrollIntoView({ block: "center", behavior: "smooth" })
    })
  }, [])

  const handleAnalyze = async () => {
    if (!agentEnabled) {
      setAnalysisError(copy.disabled)
      toast.error(copy.disabled)
      return
    }
    if (!content.trim()) return

    setAnalyzing(true)
    setAnalysis(null)
    setTrajectory(null)
    setAnalysisError(null)
    const result = await runStatelessAgentAnalysis(content, locale as "zh" | "en")
    if (result.success) {
      setAnalysis(result.data.analysis)
      setTrajectory(result.data.trajectory)
    } else {
      setAnalysisError(result.error)
      toast.error(result.error)
    }
    setAnalyzing(false)
  }

  const handleClear = () => {
    setContent("")
    setAnalysis(null)
    setTrajectory(null)
    setSelectedTemplateId(null)
    setAnalysisError(null)
  }

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <FlaskConical className="size-4" />
            {copy.eyebrow}
          </span>
        }
        title={copy.title}
        description={copy.intro}
      />

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_420px]">
        <SurfaceCard className="space-y-5">
          <div>
            <Folio>brief</Folio>
            <p className="prose-lab mt-2 text-muted-foreground">{copy.brief}</p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="ui-body text-muted-foreground">characters</span>
              <strong className="font-mono">{content.length}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="ui-body text-muted-foreground">lines</span>
              <strong className="font-mono">{content ? content.split(/\r?\n/).length : 0}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="ui-body text-muted-foreground">variables</span>
              <strong className="font-mono">{variableCount}</strong>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <label className="ui-body font-medium" htmlFor="playground-source">
            {copy.textarea}
          </label>
          <Textarea
            aria-label={isZh ? "Playground 提示词输入" : "Playground prompt input"}
            id="playground-source"
            onFocus={(event) => handleMobileFocus(event.currentTarget)}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("placeholder")}
            rows={18}
            value={content}
          />
          {analysisError ? (
            <div className="rounded-[var(--radius-sm)] border border-[var(--vermillion)] bg-[var(--vermillion-wash)] p-3 text-sm text-[var(--vermillion)]">
              {analysisError}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAnalyze} disabled={!content.trim() || analyzing || !agentEnabled} data-variant="primary">
              {analyzing ? ta("analyzing") : copy.run}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={!content && !analysis}>
              <RotateCcw className="size-4" />
              {copy.clear}
            </Button>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <div>
            <Folio>console</Folio>
            <h2 className="mt-2 text-2xl">{copy.console}</h2>
          </div>
          <AnalysisPanel
            analysis={analysis}
            trajectory={trajectory}
            analyzing={analyzing}
            onAnalyze={handleAnalyze}
            runDisabled={!content.trim() || !agentEnabled}
            runDisabledReason={!agentEnabled ? copy.disabled : undefined}
          />
        </SurfaceCard>
      </div>

      <section className="mt-5 space-y-4">
        <Eyebrow>{copy.templates}</Eyebrow>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => {
            const Icon = template.icon
            const active = selectedTemplateId === template.id
            return (
              <button
                className="lab-card p-4 text-left transition-colors hover:bg-accent"
                data-interactive="true"
                key={template.id}
                onClick={() => {
                  setContent(template.content)
                  setSelectedTemplateId(template.id)
                }}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <Icon className="size-4 text-[var(--verdigris-deep)]" />
                  <Folio>{active ? "selected" : "template"}</Folio>
                </div>
                <h3 className="mt-3 text-xl">{template.title}</h3>
                <p className="ui-body mt-2 text-muted-foreground">{template.description}</p>
              </button>
            )
          })}
        </div>
      </section>
    </PageShell>
  )
}
