"use client"

import { Brain, Search, Database, ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AgentTrajectoryStep } from "@/types/agent"

interface TrajectoryTimelineProps {
  trajectory: AgentTrajectoryStep[] | null
  loading?: boolean
  className?: string
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPayload(value: Record<string, unknown> | null) {
  if (!value) return null
  return JSON.stringify(value, null, 2)
}

function getObservationPreview(step: AgentTrajectoryStep) {
  const preview =
    typeof step.data?.resultPreview === "string" && step.data.resultPreview.trim()
      ? step.data.resultPreview
      : step.content

  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview
}

export function TrajectoryTimeline({
  trajectory,
  loading,
  className,
}: TrajectoryTimelineProps) {
  const t = useTranslations("agent.timeline")

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">{t("loading")}</span>
        </div>
      </div>
    )
  }

  if (!trajectory || trajectory.length === 0) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="text-sm font-medium">{t("title")}</div>
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <div className="text-sm font-medium">{t("title")}</div>
        <p className="text-xs text-muted-foreground">{t("latest")}</p>
      </div>

      <div className="relative space-y-3 pl-4 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-border">
        {trajectory.map((step) => {
          const inputPayload = formatPayload(step.input)
          const dataPayload = formatPayload(step.data)
          const query =
            typeof step.input?.query === "string" && step.input.query.trim()
              ? step.input.query
              : null

          const icon =
            step.phase === "thought" ? (
              <Brain className="h-3.5 w-3.5" />
            ) : step.phase === "action" ? (
              <Search className="h-3.5 w-3.5" />
            ) : (
              <Database className="h-3.5 w-3.5" />
            )

          return (
            <div key={`${step.step}-${step.timestamp}`} className="relative">
              <div className="absolute -left-4 top-4 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />

              <div
                className={cn(
                  "rounded-lg border bg-card p-3 shadow-sm",
                  step.phase === "action" && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={step.phase === "action" ? "default" : "outline"}>
                    {t(step.phase)}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {icon}
                    {t("step", { step: step.step })}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatTimestamp(step.timestamp)}</span>
                </div>

                {step.phase === "observation" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">{getObservationPreview(step)}</p>
                    <details className="group rounded-md border bg-muted/40 px-3 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>{t("details")}</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div className="space-y-1">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t("content")}
                          </div>
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-background p-2 text-xs">
                            {step.content}
                          </pre>
                        </div>
                        {dataPayload && (
                          <div className="space-y-1">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              {t("data")}
                            </div>
                            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-background p-2 text-xs">
                              {dataPayload}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">{step.content}</p>

                    {step.phase === "action" && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {step.tool && (
                          <Badge variant="secondary">
                            {t("tool")}: {step.tool}
                          </Badge>
                        )}
                        {query && (
                          <span className="rounded-md border bg-muted/40 px-2 py-1">
                            {t("query")}: {query}
                          </span>
                        )}
                      </div>
                    )}

                    {inputPayload && (
                      <details className="group rounded-md border bg-muted/40 px-3 py-2">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-muted-foreground">
                          <span>{t("input")}</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-background p-2 text-xs">
                          {inputPayload}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
