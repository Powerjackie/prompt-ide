"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Bot,
  FlaskConical,
  PenTool,
  Languages,
  Headset,
  Code2,
  RotateCcw,
  ShieldAlert,
  Tags,
  CopyCheck,
  Workflow,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { runStatelessAgentAnalysis } from "@/app/actions/agent.actions"
import type { AgentAnalysisResult, AgentTrajectoryStep } from "@/types/agent"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/layout/section-header"
import { toast } from "sonner"

type PlaygroundTemplate = {
  id: string
  icon: typeof PenTool
  title: string
  description: string
  content: string
  tone: string
  iconTone: string
}

export default function PlaygroundPage() {
  const locale = useLocale() as "zh" | "en"
  const t = useTranslations("playground")
  const ta = useTranslations("agent")
  const [content, setContent] = useState("")
  const [analysis, setAnalysis] = useState<AgentAnalysisResult | null>(null)
  const [trajectory, setTrajectory] = useState<AgentTrajectoryStep[] | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const templates = useMemo<PlaygroundTemplate[]>(
    () => [
      {
        id: "writing",
        icon: PenTool,
        title: t("templates.writing.title"),
        description: t("templates.writing.description"),
        content: t.raw("templates.writing.content") as string,
        tone: "border-violet-200/80 bg-violet-50/80 hover:border-violet-300 dark:border-fuchsia-300/60 dark:bg-[linear-gradient(180deg,rgba(255,225,248,0.98),rgba(255,192,236,0.92))] dark:text-[#311236] dark:hover:border-fuchsia-300/80 dark:hover:bg-[linear-gradient(180deg,rgba(255,236,251,1),rgba(255,204,241,0.96))]",
        iconTone: "border-violet-200/80 bg-violet-100/80 text-violet-700 dark:border-fuchsia-300/52 dark:bg-fuchsia-200/72 dark:text-[#6d1f68]",
      },
      {
        id: "translation",
        icon: Languages,
        title: t("templates.translation.title"),
        description: t("templates.translation.description"),
        content: t.raw("templates.translation.content") as string,
        tone: "border-sky-200/80 bg-sky-50/80 hover:border-sky-300 dark:border-cyan-300/60 dark:bg-[linear-gradient(180deg,rgba(229,252,255,0.98),rgba(190,241,255,0.94))] dark:text-[#123142] dark:hover:border-cyan-300/82 dark:hover:bg-[linear-gradient(180deg,rgba(238,253,255,1),rgba(204,246,255,0.98))]",
        iconTone: "border-sky-200/80 bg-sky-100/80 text-sky-700 dark:border-cyan-300/54 dark:bg-cyan-200/72 dark:text-[#155a6b]",
      },
      {
        id: "support",
        icon: Headset,
        title: t("templates.support.title"),
        description: t("templates.support.description"),
        content: t.raw("templates.support.content") as string,
        tone: "border-emerald-200/80 bg-emerald-50/80 hover:border-emerald-300 dark:border-lime-300/56 dark:bg-[linear-gradient(180deg,rgba(245,255,220,0.98),rgba(216,244,162,0.94))] dark:text-[#24321a] dark:hover:border-lime-300/78 dark:hover:bg-[linear-gradient(180deg,rgba(250,255,232,1),rgba(224,247,175,0.98))]",
        iconTone: "border-emerald-200/80 bg-emerald-100/80 text-emerald-700 dark:border-lime-300/50 dark:bg-lime-200/72 dark:text-[#4c6418]",
      },
      {
        id: "code",
        icon: Code2,
        title: t("templates.code.title"),
        description: t("templates.code.description"),
        content: t.raw("templates.code.content") as string,
        tone: "border-amber-200/80 bg-amber-50/80 hover:border-amber-300 dark:border-indigo-300/56 dark:bg-[linear-gradient(180deg,rgba(240,242,255,0.99),rgba(204,214,255,0.95))] dark:text-[#1c2252] dark:hover:border-indigo-300/78 dark:hover:bg-[linear-gradient(180deg,rgba(245,247,255,1),rgba(214,222,255,0.98))]",
        iconTone: "border-amber-200/80 bg-amber-100/80 text-amber-700 dark:border-indigo-300/50 dark:bg-indigo-200/72 dark:text-[#3946a7]",
      },
    ],
    [t]
  )

  const characterCount = content.length
  const lineCount = content.length === 0 ? 0 : content.split(/\r?\n/).length

  const handleAnalyze = async () => {
    if (!content.trim()) return

    setAnalyzing(true)

    const result = await runStatelessAgentAnalysis(content, locale)
    if (result.success) {
      setAnalysis(result.data.analysis)
      setTrajectory(result.data.trajectory)
    } else {
      toast.error(result.error)
    }

    setAnalyzing(false)
  }

  const handleTemplate = (template: PlaygroundTemplate) => {
    setContent(template.content)
    setSelectedTemplateId(template.id)
  }

  const handleClear = () => {
    setContent("")
    setAnalysis(null)
    setTrajectory(null)
    setSelectedTemplateId(null)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          <>
            <FlaskConical className="h-3.5 w-3.5" />
            {t("eyebrow")}
          </>
        }
        title={t("title")}
        description={t("description")}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-5">
          <section className="app-panel space-y-4 p-5 lg:p-6">
            <SectionHeader
              title={t("brief.title")}
              description={t("brief.description")}
            />
            <div className="chip-row">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {t("signals.variables")}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {t("signals.risk")}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {t("signals.similar")}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {t("signals.trajectory")}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("brief.stateless")}
            </p>
          </section>

          <section className="app-panel overflow-hidden p-0">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 lg:px-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t("workspace.title")}
                </div>
                <p className="text-sm text-muted-foreground">{t("workspace.description")}</p>
              </div>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
                {t("workspace.mode")}
              </Badge>
            </div>

            <div className="space-y-4 px-5 py-5 lg:px-6 lg:py-6">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("placeholder")}
                className="min-h-[360px] rounded-[1.5rem] border-border/70 bg-background/80 px-4 py-4 font-mono text-sm leading-6 shadow-inner focus-visible:border-primary/30 focus-visible:ring-primary/15 dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.74),rgba(17,22,37,0.88))] dark:text-slate-100 dark:caret-primary"
              />

              <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/70 bg-muted/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-cyan-200/34 dark:bg-[linear-gradient(180deg,rgba(18,25,42,0.98),rgba(12,18,31,0.98))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_0_1px_rgba(79,246,255,0.08),0_16px_32px_-18px_rgba(79,246,255,0.28)]">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground dark:text-slate-100">
                  <span className="font-medium tracking-[0.01em] dark:text-slate-100">{t("workspace.characters", { count: characterCount })}</span>
                  <span className="font-medium tracking-[0.01em] dark:text-slate-100">{t("workspace.lines", { count: lineCount })}</span>
                  <span className="font-medium dark:text-cyan-50">
                    {content.trim() ? t("workspace.ready") : t("workspace.waiting")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-2xl dark:text-slate-100 dark:hover:bg-white/7 dark:hover:text-white dark:disabled:opacity-100 dark:disabled:text-slate-100/80"
                    onClick={handleClear}
                    disabled={!content && !analysis && !trajectory}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("workspace.clear")}
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing || !content.trim()}
                    className="rounded-2xl dark:disabled:opacity-100 dark:disabled:bg-[linear-gradient(135deg,rgba(109,248,255,0.98),rgba(131,145,255,0.92))] dark:disabled:text-[#07131b] dark:disabled:shadow-[0_0_0_1px_rgba(79,246,255,0.22),0_18px_38px_-18px_rgba(79,246,255,0.42)]"
                  >
                    <Bot className="h-4 w-4 mr-1" />
                    {analyzing ? ta("analyzing") : t("analyze")}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="app-panel space-y-4 p-5 lg:p-6">
            <SectionHeader
              title={t("templates.title")}
              description={t("templates.description")}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => {
                const Icon = template.icon
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplate(template)}
                    className={[
                      "rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5",
                      template.tone,
                      selectedTemplateId === template.id
                        ? "ring-2 ring-primary/30 shadow-[0_18px_45px_-35px_rgba(79,70,229,0.45)] dark:shadow-[0_20px_50px_-32px_rgba(79,246,255,0.52)]"
                        : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${template.iconTone}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{template.title}</div>
                          {selectedTemplateId === template.id ? (
                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] dark:bg-primary/10 dark:text-primary">
                              {t("templates.loaded")}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground dark:text-black/68">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="app-panel space-y-4 p-5 lg:p-6">
            <SectionHeader
              title={t("outputs.title")}
              description={t("outputs.description")}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4 dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.72),rgba(17,22,37,0.84))]">
                <div className="flex items-center gap-2 font-medium">
                  <Tags className="h-4 w-4 text-primary" />
                  {t("outputs.suggestions")}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("outputs.suggestionsDescription")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4 dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.72),rgba(17,22,37,0.84))]">
                <div className="flex items-center gap-2 font-medium">
                  <CopyCheck className="h-4 w-4 text-primary" />
                  {t("outputs.variables")}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("outputs.variablesDescription")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4 dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.72),rgba(17,22,37,0.84))]">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  {t("outputs.risk")}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("outputs.riskDescription")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4 dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.72),rgba(17,22,37,0.84))]">
                <div className="flex items-center gap-2 font-medium">
                  <Workflow className="h-4 w-4 text-primary" />
                  {t("outputs.trajectory")}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("outputs.trajectoryDescription")}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="app-panel space-y-4 p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <SectionHeader
              title={t("results")}
              description={t("resultsDescription")}
            />
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
              {analyzing
                ? t("resultsState.running")
                : analysis
                  ? t("resultsState.live")
                  : t("resultsState.idle")}
            </Badge>
          </div>
          <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-4 lg:p-5 dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.76),rgba(17,22,37,0.9))]">
            {!analysis && !analyzing ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] border border-primary/15 bg-primary/8 text-primary dark:border-primary/28 dark:bg-primary/12 dark:shadow-[0_0_34px_-16px_rgba(79,246,255,0.82)]">
                  <Bot className="h-6 w-6" />
                </span>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">{t("emptyState.title")}</div>
                  <p className="max-w-md text-sm leading-6 text-muted-foreground">
                    {t("emptyState.description")}
                  </p>
                </div>
                <div className="chip-row justify-center">
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {t("signals.variables")}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {t("signals.risk")}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {t("signals.similar")}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {t("signals.trajectory")}
                  </Badge>
                </div>
              </div>
            ) : (
              <AnalysisPanel
                analysis={analysis}
                trajectory={trajectory}
                analyzing={analyzing}
                analyzingLabel={ta("analyzingWithEngine", { engine: "MiniMax-2.7" })}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
