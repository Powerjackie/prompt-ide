"use client"

import { useMessages, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Bot, AlertTriangle, Shield, Tag, FileText, Copy, Puzzle } from "lucide-react"
import { RISK_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { AgentAnalysisResult, AgentTrajectoryStep } from "@/types/agent"
import { TrajectoryTimeline } from "./trajectory-timeline"

interface AnalysisPanelProps {
  analysis: AgentAnalysisResult | null
  trajectory?: AgentTrajectoryStep[] | null
  trajectoryLoading?: boolean
  onAnalyze?: () => void
  analyzing?: boolean
  compact?: boolean
  analyzingLabel?: string
  runDisabled?: boolean
  runDisabledReason?: string
}

function normalizeAgentKey(key: string) {
  return key.replace(/^agent\./, "")
}

function normalizeRiskKey(key: string) {
  return key.replace(/^agent\.risk\./, "")
}

function formatFallbackKey(key: string) {
  return key
    .replace(/^agent\.risk\./, "")
    .replace(/^agent\./, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_.]/g, " ")
    .trim()
}

function hasOwnProperty(value: unknown, property: string) {
  return typeof value === "object" && value !== null && property in value
}

function getMessageValue(messages: unknown, path: string[]) {
  let current: unknown = messages

  for (const segment of path) {
    if (!hasOwnProperty(current, segment)) {
      return undefined
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

function hasMessage(messages: unknown, path: string[]) {
  return typeof getMessageValue(messages, path) === "string"
}

function hasParams(params?: Record<string, string | number>) {
  return !!params && Object.keys(params).length > 0
}

export function AnalysisPanel({
  analysis,
  trajectory,
  trajectoryLoading,
  onAnalyze,
  analyzing,
  compact,
  analyzingLabel,
  runDisabled = false,
  runDisabledReason,
}: AnalysisPanelProps) {
  const messages = useMessages()
  const t = useTranslations("agent")
  const tr = useTranslations("agent.risk")
  const loadingText = analyzingLabel ?? t("analyzing")
  const riskLabel = analysis ? tr(analysis.riskLevel) : ""

  if (!analysis) {
    return (
      <div className="space-y-3 py-8 text-center">
        {analyzing ? (
          <div className="space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">{loadingText}</p>
          </div>
        ) : (
          <>
            <Bot className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">{t("noAnalysis")}</p>
          </>
        )}
        {onAnalyze ? (
          <Button size="sm" onClick={onAnalyze} disabled={analyzing || runDisabled}>
            <Bot className="mr-1 h-4 w-4" />
            {analyzing ? loadingText : t("runAnalysis")}
          </Button>
        ) : null}
        {runDisabledReason ? (
          <p className="text-xs text-destructive">{runDisabledReason}</p>
        ) : null}
      </div>
    )
  }

  const fallbackSummaryParams: Record<string, Record<string, string | number>> = {
    summaryCategory: { category: analysis.suggestedCategory },
    summaryVariables: { count: analysis.extractedVariables.length },
    summaryRisk: { level: analysis.riskLevel },
    summaryDuplicates: { count: analysis.duplicateCandidates.length },
  }

  const translateReason = (reason: { key: string; params?: Record<string, string | number> }) => {
    const normalizedKey = normalizeRiskKey(reason.key)
    const params = hasParams(reason.params) ? reason.params : undefined

    if (params && normalizedKey === "detectedPII" && params.type) {
      const translatedTypeKey = String(params.type)
      const translatedType = hasMessage(messages, ["agent", "risk", translatedTypeKey])
        ? tr(translatedTypeKey)
        : formatFallbackKey(translatedTypeKey)

      if (hasMessage(messages, ["agent", "risk", "detectedPII"])) {
        return tr("detectedPII", { type: translatedType })
      }
    }

    if (params && normalizedKey === "injectionPattern" && params.pattern) {
      const translatedPatternKey = String(params.pattern)
      const translatedPattern = hasMessage(messages, ["agent", "risk", translatedPatternKey])
        ? tr(translatedPatternKey)
        : formatFallbackKey(translatedPatternKey)

      if (hasMessage(messages, ["agent", "risk", "injectionPattern"])) {
        return tr("injectionPattern", { pattern: translatedPattern })
      }
    }

    if (hasMessage(messages, ["agent", "risk", normalizedKey])) {
      return params ? tr(normalizedKey, params) : tr(normalizedKey)
    }

    if (params) {
      const suffix = Object.entries(params)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
      return suffix ? `${formatFallbackKey(normalizedKey)} (${suffix})` : formatFallbackKey(normalizedKey)
    }

    return formatFallbackKey(normalizedKey)
  }

  const summaryText = analysis.summaryParts
    .map((part) => {
      const normalizedKey = normalizeAgentKey(part.key)

      if (normalizedKey === "summaryCategory") {
        return t("summaryCategory", {
          category: String(part.params?.category ?? analysis.suggestedCategory),
        })
      }

      if (normalizedKey === "summaryVariables") {
        return t("summaryVariables", {
          count: Number(part.params?.count ?? analysis.extractedVariables.length),
        })
      }

      if (normalizedKey === "summaryRisk") {
        return t("summaryRisk", {
          level:
            typeof part.params?.level === "string" &&
            hasMessage(messages, ["agent", "risk", String(part.params.level)])
              ? tr(String(part.params.level))
              : riskLabel,
        })
      }

      if (normalizedKey === "summaryDuplicates") {
        return t("summaryDuplicates", {
          count: Number(part.params?.count ?? analysis.duplicateCandidates.length),
        })
      }

      const params = hasParams(part.params) ? part.params : fallbackSummaryParams[normalizedKey]

      if (hasMessage(messages, ["agent", normalizedKey])) {
        return params ? t(normalizedKey, params) : t(normalizedKey)
      }

      return formatFallbackKey(normalizedKey)
    })
    .join(" · ")

  return (
    <div className="space-y-4">
      {analyzing ? (
        <>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>{loadingText}</span>
          </div>
          <Separator />
        </>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("confidence")}</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(analysis.confidence * 100)}%
          </span>
        </div>
        <Progress value={analysis.confidence * 100} className="h-1.5" />
        <p className="text-xs text-muted-foreground">{summaryText}</p>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{t("riskLevel")}</span>
        </div>
        <Badge className={cn("text-xs", RISK_COLORS[analysis.riskLevel])}>
          {riskLabel}
        </Badge>
        {analysis.reasons.length > 0 ? (
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {analysis.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-1">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-yellow-500" />
                {translateReason(reason)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Separator />

      {!compact ? (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{t("suggestions")}</span>
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-muted-foreground">{t("category")}:</span>{" "}
                {analysis.suggestedCategory}
              </div>
              <div>
                <span className="text-muted-foreground">{t("model")}:</span>{" "}
                {analysis.suggestedModel}
              </div>
              <div>
                <span className="text-muted-foreground">{t("status")}:</span>{" "}
                {analysis.suggestedStatus}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {analysis.suggestedTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Separator />
        </>
      ) : null}

      {analysis.extractedVariables.length > 0 ? (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">
                {t("variables")} ({analysis.extractedVariables.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.extractedVariables.map((variable) => (
                <Badge key={variable.name} variant="secondary" className="text-[10px] font-mono">
                  {`{{${variable.name}}}`}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
        </>
      ) : null}

      {analysis.duplicateCandidates.length > 0 ? (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Copy className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">
                {t("similarPrompts")} ({analysis.duplicateCandidates.length})
              </span>
            </div>
            <div className="space-y-1">
              {analysis.duplicateCandidates.map((duplicate) => (
                <Link
                  key={duplicate.id}
                  href={`/prompts/${duplicate.id}`}
                  className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-accent/50"
                >
                  <span className="truncate">{duplicate.title}</span>
                  <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
                    {Math.round(duplicate.similarity * 100)}%
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <Separator />
        </>
      ) : null}

      {analysis.moduleCandidates.length > 0 && !compact ? (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Puzzle className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{t("moduleCandidates")}</span>
            </div>
            {analysis.moduleCandidates.map((moduleCandidate, index) => (
              <div key={index} className="rounded bg-muted/50 p-2 text-xs">
                <Badge variant="outline" className="mb-1 text-[10px]">
                  {moduleCandidate.type}
                </Badge>
                <p className="font-mono">{moduleCandidate.content}</p>
              </div>
            ))}
          </div>
          <Separator />
        </>
      ) : null}

      {trajectory !== undefined || trajectoryLoading ? (
        <>
          <TrajectoryTimeline trajectory={trajectory ?? null} loading={trajectoryLoading} />
          <Separator />
        </>
      ) : null}

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {t("matchedRules")} ({analysis.matchedRules.length})
        </span>
        <div className="flex flex-wrap gap-1">
          {analysis.matchedRules.map((rule, index) => (
            <Badge key={index} variant="outline" className="text-[10px] font-mono">
              {rule}
            </Badge>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">v{analysis.analysisVersion}</p>
      </div>

      {onAnalyze ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onAnalyze}
          disabled={analyzing || runDisabled}
          className="w-full"
        >
          <Bot className="mr-1 h-4 w-4" />
          {analyzing ? loadingText : t("reanalyze")}
        </Button>
      ) : null}
      {runDisabledReason ? (
        <p className="text-xs text-destructive">{runDisabledReason}</p>
      ) : null}
    </div>
  )
}
