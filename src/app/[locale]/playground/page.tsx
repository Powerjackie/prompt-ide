"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Code2,
  CopyCheck,
  FlaskConical,
  Headset,
  Languages,
  PenTool,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Tags,
  Workflow,
} from "lucide-react"
import { gsap, useGSAP } from "@/lib/gsap-config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { runStatelessAgentAnalysis } from "@/app/actions/agent.actions"
import { getEffectiveSettings } from "@/app/actions/settings.actions"
import type { AgentAnalysisResult, AgentTrajectoryStep } from "@/types/agent"
import { toast } from "sonner"

type PlaygroundTemplate = {
  id: string
  icon: typeof PenTool
  title: string
  description: string
  content: string
}

type LocalizedCopy = {
  kicker: string
  title: string
  intro: string
  stageLabel: string
  stageBody: string
  stageMode: string
  consoleLabel: string
  consoleBody: string
  briefLabel: string
  briefBody: string
  templatesLabel: string
  templatesBody: string
  ledgerMode: string
  ledgerContract: string
  ledgerEngine: string
  idleTitle: string
  idleBody: string
  runningTitle: string
  runningBody: string
  liveTitle: string
  liveBody: string
  stageReady: string
  stageWaiting: string
  stageRunning: string
  variables: string
  consoleHint: string
  actionOpenLibrary: string
  actionOpenModules: string
  errorTitle: string
  errorBody: string
}

const CONSOLE_RUNNING_STEPS = [
  "Parse prompt structure",
  "Extract reusable variables",
  "Read risk and duplicate signals",
] as const

function LoadingConsoleLine() {
  return <div className="gs-playground-running-line h-2 w-full rounded-full bg-foreground/10" />
}

export default function PlaygroundPage() {
  const locale = useLocale()
  const t = useTranslations("playground")
  const ta = useTranslations("agent")
  const containerRef = useRef<HTMLDivElement>(null)
  const stageShellRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState("")
  const [analysis, setAnalysis] = useState<AgentAnalysisResult | null>(null)
  const [trajectory, setTrajectory] = useState<AgentTrajectoryStep[] | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [agentEnabled, setAgentEnabled] = useState(true)

  const isZh = locale.startsWith("zh")

  const ui = useMemo<LocalizedCopy>(
    () =>
      isZh
        ? {
            kicker: "STATELESS ANALYSIS FLOOR",
            title: "PLAYGROUND",
            intro: "把原始提示词放进工作台，先看结构、变量和风险，再决定它要不要进入正式界面。",
            stageLabel: "工作台舞台",
            stageBody: "把当前提示词当作待加工材料，不写历史、不落草稿，只做即时压力测试。",
            stageMode: "即时模式",
            consoleLabel: "分析控制台",
            consoleBody: "右侧只负责承接系统返回，不承担编辑，不制造额外状态。",
            briefLabel: "任务简报",
            briefBody: "这是一个无状态分析现场。输入、运行、读取、清空，动作短，反馈硬。",
            templatesLabel: "模板入口",
            templatesBody: "模板只负责把素材送上舞台，不替代真正的编辑工作。",
            ledgerMode: "无状态",
            ledgerContract: "不写入历史",
            ledgerEngine: "MiniMax-2.7",
            idleTitle: "控制台待命",
            idleBody: "输入任意提示词后运行分析。系统会回填分类、变量、重复信号和风险判断。",
            runningTitle: "系统正在读取",
            runningBody: "结构、变量与风险信号正在进入控制台。",
            liveTitle: "实时结果",
            liveBody: "当前结果只属于这一轮分析，不写历史，不污染工作区。",
            stageReady: "可以运行分析",
            stageWaiting: "等待输入素材",
            stageRunning: "分析中",
            variables: "变量",
            consoleHint: "结果按可读顺序进入，不打断工作台。",
            actionOpenLibrary: "打开 Prompt Library",
            actionOpenModules: "查看 Modules",
            errorTitle: "分析中断",
            errorBody: "这次运行没有拿到结果。先看错误，再决定是重试还是换一段素材。",
          }
        : {
            kicker: "STATELESS ANALYSIS FLOOR",
            title: "PLAYGROUND",
            intro: "Drop raw prompt text into the workspace, read structure, variables, and risk first, then decide if it deserves product surface.",
            stageLabel: "Workspace Stage",
            stageBody: "Treat the current prompt as working material. No history writeback. No hidden draft state. Just live analysis.",
            stageMode: "Live Pass",
            consoleLabel: "Analysis Console",
            consoleBody: "The right rail only receives system output. It does not edit, and it does not invent extra state.",
            briefLabel: "Brief",
            briefBody: "This is a stateless analysis floor. Input, run, read, clear. Short motions. Hard feedback.",
            templatesLabel: "Template Feed",
            templatesBody: "Templates are just fast source material. They do not replace the real workspace.",
            ledgerMode: "Stateless",
            ledgerContract: "No history writeback",
            ledgerEngine: "MiniMax-2.7",
            idleTitle: "Console Standing By",
            idleBody: "Run any prompt to receive structure, variables, duplicate signals, and risk reads.",
            runningTitle: "System Reading",
            runningBody: "Structure, variables, and risk signals are moving into the console now.",
            liveTitle: "Live Result",
            liveBody: "This result belongs to the current pass only. It does not write history or mutate the workbench.",
            stageReady: "Ready to analyze",
            stageWaiting: "Waiting for source text",
            stageRunning: "Running analysis",
            variables: "Variables",
            consoleHint: "Results arrive in reading order so the workspace stays legible.",
            actionOpenLibrary: "Open Prompt Library",
            actionOpenModules: "Inspect Modules",
            errorTitle: "Analysis Interrupted",
            errorBody: "This pass did not return a live result. Read the failure first, then retry or change the source text.",
          },
    [isZh]
  )

  useEffect(() => {
    let active = true

    getEffectiveSettings().then((result) => {
      if (!active) return
      if (result.success) {
        setAgentEnabled(result.data.agent.enabled)
      }
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

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  )

  const characterCount = content.length
  const lineCount = content.length === 0 ? 0 : content.split(/\r?\n/).length
  const variableCount = useMemo(() => {
    const names = new Set<string>()

    for (const match of content.matchAll(
      /\{\{\s*([\w.-]+)\s*\}\}|\{([A-Za-z_][\w.-]*)\}|\$\{([A-Za-z_][\w.-]*)\}/g
    )) {
      const name = match[1] ?? match[2] ?? match[3]
      if (name) {
        names.add(name)
      }
    }

    return names.size
  }, [content])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const entranceTargets = {
        header: ".gs-playground-header",
        stage: ".gs-playground-stage",
        console: ".gs-playground-console",
        aux: ".gs-playground-aux",
      }

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(Object.values(entranceTargets), {
          autoAlpha: 1,
          x: 0,
          y: 0,
          clearProps: "opacity,transform",
        })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(entranceTargets.header, { autoAlpha: 0, y: 16 })
        gsap.set(entranceTargets.stage, { autoAlpha: 0, y: 20, scale: 0.985 })
        gsap.set(entranceTargets.console, { autoAlpha: 0, x: 24 })
        gsap.set(entranceTargets.aux, { autoAlpha: 0, y: 24 })

        const tl = gsap.timeline({ defaults: { ease: "power2.out" } })

        tl.to(entranceTargets.header, {
          autoAlpha: 1,
          y: 0,
          duration: 0.34,
        })
          .to(
            entranceTargets.stage,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.44,
            },
            "-=0.16"
          )
          .to(
            entranceTargets.console,
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.4,
            },
            "-=0.18"
          )
          .to(
            entranceTargets.aux,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.36,
              stagger: 0.08,
            },
            "-=0.14"
          )

        tl.eventCallback("onComplete", () => {
          gsap.set(Object.values(entranceTargets), { clearProps: "opacity,transform" })
        })

        return () => {
          tl.kill()
        }
      })

      return () => mm.revert()
    },
    { scope: containerRef }
  )

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".gs-playground-metric", {
          autoAlpha: 1,
          y: 0,
          clearProps: "opacity,transform",
        })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".gs-playground-metric",
          { autoAlpha: 0.45, y: 8 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.24,
            stagger: 0.04,
            ease: "power2.out",
            clearProps: "opacity,transform",
          }
        )
      })

      return () => mm.revert()
    },
    {
      scope: containerRef,
      dependencies: [characterCount, lineCount, variableCount, selectedTemplateId],
      revertOnUpdate: true,
    }
  )

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".gs-playground-console-module", {
          autoAlpha: 1,
          x: 0,
          y: 0,
          visibility: "inherit",
        })
        gsap.set(".gs-playground-stage-signal", {
          autoAlpha: 1,
          x: 0,
          visibility: "inherit",
        })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (analyzing) {
          gsap.set(".gs-playground-console-module", {
            autoAlpha: 1,
            x: 0,
            y: 0,
            visibility: "inherit",
          })

          gsap.fromTo(
            ".gs-playground-running-line",
            { transformOrigin: "0% 50%", scaleX: 0.18, autoAlpha: 0.3 },
            {
              scaleX: 1,
              autoAlpha: 1,
              duration: 0.9,
              repeat: -1,
              yoyo: true,
              ease: "power1.inOut",
              stagger: 0.12,
            }
          )

          gsap.fromTo(
            ".gs-playground-stage-signal",
            { autoAlpha: 0.55, x: -6 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.45,
              repeat: -1,
              yoyo: true,
              ease: "power2.inOut",
            }
          )

          return
        }

        gsap.killTweensOf(".gs-playground-running-line")
        gsap.killTweensOf(".gs-playground-stage-signal")

        if (analysis) {
          gsap.fromTo(
            ".gs-playground-console-module",
            { autoAlpha: 0, x: 18, y: 10 },
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              duration: 0.4,
              stagger: 0.08,
              ease: "power2.out",
              clearProps: "opacity,transform",
            }
          )

          gsap.set(".gs-playground-stage-signal", {
            autoAlpha: 1,
            x: 0,
            visibility: "inherit",
          })
          return
        }

        gsap.set(".gs-playground-console-module", {
          autoAlpha: 1,
          x: 0,
          y: 0,
          visibility: "inherit",
        })
        gsap.set(".gs-playground-stage-signal", {
          autoAlpha: 1,
          x: 0,
          visibility: "inherit",
        })
      })

      return () => {
        mm.revert()
        gsap.killTweensOf(".gs-playground-running-line")
        gsap.killTweensOf(".gs-playground-stage-signal")
      }
    },
    {
      scope: containerRef,
      dependencies: [analyzing, analysis, trajectory?.length ?? 0],
      revertOnUpdate: true,
    }
  )

  const handleMobileFocus = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element || typeof window === "undefined") return
    if (!window.matchMedia("(max-width: 767px)").matches) return

    requestAnimationFrame(() => {
      element.scrollIntoView({ block: "center", behavior: "smooth" })
    })
  }, [])

  const handleAnalyze = async () => {
    if (!agentEnabled) {
      const message = ta("disabled")
      setAnalysisError(message)
      toast.error(message)
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

  const handleTemplate = (template: PlaygroundTemplate) => {
    setContent(template.content)
    setSelectedTemplateId(template.id)
  }

  const handleClear = () => {
    setContent("")
    setAnalysis(null)
    setTrajectory(null)
    setSelectedTemplateId(null)
    setAnalysisError(null)
  }

  return (
    <div ref={containerRef} className="playground-theater">
      <header className="playground-theater__header gs-playground-header brutal-border-thick brutal-shadow-lg">
        <div className="playground-kicker">
          <FlaskConical className="h-3.5 w-3.5" />
          {ui.kicker}
        </div>

        <div className="playground-theater__hero">
          <div className="space-y-4">
            <h1 className="playground-theater__title">{ui.title}</h1>
            <p className="playground-theater__copy">{ui.intro}</p>
          </div>

          <div className="playground-theater__ledger">
            <div className="playground-ledger-row">
              <span className="playground-ledger-label">ENGINE</span>
              <span className="playground-ledger-value">{ui.ledgerEngine}</span>
            </div>
            <div className="playground-ledger-row">
              <span className="playground-ledger-label">MODE</span>
              <span className="playground-ledger-value">{ui.ledgerMode}</span>
            </div>
            <div className="playground-ledger-row">
              <span className="playground-ledger-label">CONTRACT</span>
              <span className="playground-ledger-value">{ui.ledgerContract}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="playground-theater__grid">
        <aside className="playground-brief-rail order-3 space-y-5 lg:order-1">
          <section className="gs-playground-aux playground-side-panel brutal-border brutal-shadow">
            <div className="flex flex-col gap-3">
              <span className="playground-panel-label">{ui.briefLabel}</span>
              <Badge variant="outline" className="rounded-none border-2 px-2 py-1 text-[10px] h-auto !whitespace-normal !w-full leading-[1.4]">
                {t("brief.stateless")}
              </Badge>
            </div>
            <p className="playground-panel-copy">{ui.briefBody}</p>
            <div className="playground-brief-signals">
              <div className="playground-brief-signal">
                <span className="playground-brief-signal__label">{t("signals.variables")}</span>
                <span className="playground-brief-signal__value">{ui.consoleHint}</span>
              </div>
              <div className="playground-brief-signal">
                <span className="playground-brief-signal__label">{t("signals.risk")}</span>
                <span className="playground-brief-signal__value">{t("brief.description")}</span>
              </div>
            </div>
          </section>

          <section className="gs-playground-aux playground-side-panel brutal-border brutal-shadow">
            <div className="space-y-2">
              <div className="playground-panel-label">{ui.templatesLabel}</div>
              <p className="playground-panel-copy">{ui.templatesBody}</p>
            </div>

            <div className="space-y-3">
              {templates.map((template) => {
                const Icon = template.icon

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplate(template)}
                    className={[
                      "playground-template",
                      selectedTemplateId === template.id ? "playground-template--active" : "",
                    ].join(" ")}
                  >
                    <span className="playground-template__icon brutal-border">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="space-y-1">
                      <span className="playground-template__title">{template.title}</span>
                      <span className="playground-template__copy">{template.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </aside>

        <section className="order-1 lg:order-2">
          <div className="gs-playground-stage playground-stage-shell brutal-border-thick brutal-shadow-xl" ref={stageShellRef}>
            <div className="playground-stage-head">
              <div className="space-y-2">
                <div className="playground-panel-label">{ui.stageLabel}</div>
                <p className="playground-panel-copy">{ui.stageBody}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-none border-2 px-2 py-1 text-[10px] uppercase tracking-[0.18em]">
                  {ui.stageMode}
                </Badge>
                {selectedTemplate ? (
                  <Badge variant="secondary" className="rounded-none border-2 border-border bg-primary text-primary-foreground">
                    {selectedTemplate.title}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="playground-stage-metrics">
              <div className="gs-playground-metric playground-stage-metric brutal-border brutal-shadow-sm">
                <span className="playground-stage-metric__label">{t("workspace.characters", { count: characterCount })}</span>
                <span className="playground-stage-metric__value">{characterCount}</span>
              </div>
              <div className="gs-playground-metric playground-stage-metric brutal-border brutal-shadow-sm">
                <span className="playground-stage-metric__label">{t("workspace.lines", { count: lineCount })}</span>
                <span className="playground-stage-metric__value">{lineCount}</span>
              </div>
              <div className="gs-playground-metric playground-stage-metric brutal-border brutal-shadow-sm">
                <span className="playground-stage-metric__label">{ui.variables}</span>
                <span className="playground-stage-metric__value">{variableCount}</span>
              </div>
            </div>

            <div className="playground-stage-editor brutal-border brutal-shadow-sm">
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={t("placeholder")}
                className="playground-stage-textarea"
                onFocus={(event) => handleMobileFocus(event.currentTarget)}
                aria-label={isZh ? "提示词输入" : "Prompt input"}
              />
            </div>

            <div className="playground-stage-footer">
              <div className="playground-stage-status">
                <span className="gs-playground-stage-signal playground-stage-status__dot" />
                <span className="playground-stage-status__text">
                  {analyzing ? ui.stageRunning : content.trim() ? ui.stageReady : ui.stageWaiting}
                </span>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  disabled={!content && !analysis && !trajectory}
                  className="rounded-none border-2 border-transparent px-4 py-5 sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("workspace.clear")}
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || !content.trim() || !agentEnabled}
                  className="rounded-none border-2 border-border px-4 py-5"
                >
                  <Bot className="mr-1 h-4 w-4" />
                  {analyzing ? ta("analyzing") : t("analyze")}
                </Button>
              </div>
            </div>

            {!agentEnabled ? (
              <p className="mt-3 text-xs font-medium text-destructive">{ta("disabled")}</p>
            ) : null}
          </div>
        </section>

        <aside className="order-2 lg:order-3">
          <section className="gs-playground-console playground-console-shell brutal-border-thick brutal-shadow-lg">
            <div className="playground-console-head">
              <div className="space-y-2">
                <div className="playground-panel-label">{ui.consoleLabel}</div>
                <p className="playground-panel-copy">{ui.consoleBody}</p>
              </div>
              <Badge variant="outline" className="rounded-none border-2 px-2 py-1 text-[10px] uppercase tracking-[0.18em]">
                {analyzing
                  ? t("resultsState.running")
                  : analysis
                    ? t("resultsState.live")
                    : t("resultsState.idle")}
              </Badge>
            </div>

            <div className="playground-console-body">
              {analysisError && !analyzing && !analysis ? (
                <div className="gs-playground-console-module playground-console-error brutal-border brutal-shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="playground-console-error__icon brutal-border">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div className="space-y-2">
                      <h2 className="playground-console-title">{ui.errorTitle}</h2>
                      <p className="playground-panel-copy">{ui.errorBody}</p>
                    </div>
                  </div>
                  <div className="playground-console-error__body brutal-border">
                    {analysisError}
                  </div>
                </div>
              ) : null}

              {!analysis && !analyzing && !analysisError ? (
                <div className="gs-playground-console-module playground-console-idle">
                  <span className="playground-console-idle__icon brutal-border">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="space-y-2">
                    <h2 className="playground-console-title">{ui.idleTitle}</h2>
                    <p className="playground-panel-copy">{ui.idleBody}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="playground-console-note brutal-border">
                      <Tags className="h-4 w-4 text-primary" />
                      <div>
                        <div className="playground-console-note__title">{t("outputs.suggestions")}</div>
                        <p className="playground-console-note__copy">{t("outputs.suggestionsDescription")}</p>
                      </div>
                    </div>
                    <div className="playground-console-note brutal-border">
                      <CopyCheck className="h-4 w-4 text-primary" />
                      <div>
                        <div className="playground-console-note__title">{t("outputs.variables")}</div>
                        <p className="playground-console-note__copy">{t("outputs.variablesDescription")}</p>
                      </div>
                    </div>
                    <div className="playground-console-note brutal-border">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      <div>
                        <div className="playground-console-note__title">{t("outputs.risk")}</div>
                        <p className="playground-console-note__copy">{t("outputs.riskDescription")}</p>
                      </div>
                    </div>
                    <div className="playground-console-note brutal-border">
                      <Workflow className="h-4 w-4 text-primary" />
                      <div>
                        <div className="playground-console-note__title">{t("outputs.trajectory")}</div>
                        <p className="playground-console-note__copy">{t("outputs.trajectoryDescription")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="playground-console-actions">
                    <Link href="/prompts" className="playground-inline-link">
                      {ui.actionOpenLibrary}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/modules" className="playground-inline-link">
                      {ui.actionOpenModules}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : null}

              {analyzing ? (
                <div className="gs-playground-console-module playground-console-running">
                  <div className="space-y-2">
                    <div className="playground-panel-label">{ui.runningTitle}</div>
                    <p className="playground-panel-copy">{ui.runningBody}</p>
                  </div>
                  <div className="space-y-3">
                    <LoadingConsoleLine />
                    <LoadingConsoleLine />
                    <LoadingConsoleLine />
                  </div>
                  <div className="space-y-3">
                    {CONSOLE_RUNNING_STEPS.map((step) => (
                      <div key={step} className="playground-running-step brutal-border">
                        <span className="playground-running-step__index" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {analysis ? (
                <>
                  <div className="gs-playground-console-module playground-console-live-head brutal-border brutal-shadow-sm">
                    <div className="space-y-2">
                      <div className="playground-panel-label">{ui.liveTitle}</div>
                      <p className="playground-panel-copy">{ui.liveBody}</p>
                    </div>

                    <div className="playground-console-summary">
                      <div className="playground-console-summary__item">
                        <span className="playground-console-summary__label">{t("signals.risk")}</span>
                        <span className="playground-console-summary__value">{analysis.riskLevel.toUpperCase()}</span>
                      </div>
                      <div className="playground-console-summary__item">
                        <span className="playground-console-summary__label">{t("outputs.variables")}</span>
                        <span className="playground-console-summary__value">{analysis.extractedVariables.length}</span>
                      </div>
                      <div className="playground-console-summary__item">
                        <span className="playground-console-summary__label">{ta("confidence")}</span>
                        <span className="playground-console-summary__value">
                          {Math.round(analysis.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="gs-playground-console-module playground-console-live-panel brutal-border">
                    <AnalysisPanel
                      analysis={analysis}
                      trajectory={trajectory}
                      analyzing={analyzing}
                      analyzingLabel={ta("analyzingWithEngine", { engine: "MiniMax-2.7" })}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

