"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Bot, AlertTriangle, Shield, Tag, FileText, Copy, Puzzle } from "lucide-react"
import { RISK_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { AgentAnalysisResult } from "@/types/agent"
import { Link } from "@/i18n/navigation"

interface AnalysisPanelProps {
  analysis: AgentAnalysisResult | null
  onAnalyze?: () => void
  analyzing?: boolean
  compact?: boolean
}

export function AnalysisPanel({ analysis, onAnalyze, analyzing, compact }: AnalysisPanelProps) {
  const t = useTranslations("agent")
  const tr = useTranslations("agent.risk")

  if (!analysis) {
    return (
      <div className="text-center py-8 space-y-3">
        <Bot className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">{t("noAnalysis")}</p>
        {onAnalyze && (
          <Button size="sm" onClick={onAnalyze} disabled={analyzing}>
            <Bot className="h-4 w-4 mr-1" />
            {analyzing ? t("analyzing") : t("runAnalysis")}
          </Button>
        )}
      </div>
    )
  }

  // Translate a reason object using agent.risk namespace
  const translateReason = (reason: { key: string; params?: Record<string, string | number> }) => {
    if (reason.params) {
      // For PII: translate the type param itself (e.g. "email" -> "邮箱地址")
      if (reason.key === "detectedPII" && reason.params.type) {
        const translatedType = tr(String(reason.params.type))
        return tr("detectedPII", { type: translatedType })
      }
      // For injection: translate the pattern param
      if (reason.key === "injectionPattern" && reason.params.pattern) {
        const translatedPattern = tr(String(reason.params.pattern))
        return tr("injectionPattern", { pattern: translatedPattern })
      }
    }
    return tr(reason.key)
  }

  // Translate summary parts
  const summaryText = analysis.summaryParts
    .map((part) => t(part.key, part.params as Record<string, string>))
    .join(" · ")

  return (
    <div className="space-y-4">
      {/* Summary + Confidence */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("confidence")}</span>
          <span className="text-sm text-muted-foreground">{Math.round(analysis.confidence * 100)}%</span>
        </div>
        <Progress value={analysis.confidence * 100} className="h-1.5" />
        <p className="text-xs text-muted-foreground">{summaryText}</p>
      </div>

      <Separator />

      {/* Risk */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{t("riskLevel")}</span>
        </div>
        <Badge className={cn("text-xs", RISK_COLORS[analysis.riskLevel])}>
          {tr(analysis.riskLevel)}
        </Badge>
        {analysis.reasons.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
            {analysis.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-yellow-500" />
                {translateReason(r)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />

      {/* Suggestions */}
      {!compact && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{t("suggestions")}</span>
            </div>
            <div className="text-xs space-y-1">
              <div><span className="text-muted-foreground">{t("category")}:</span> {analysis.suggestedCategory}</div>
              <div><span className="text-muted-foreground">{t("model")}:</span> {analysis.suggestedModel}</div>
              <div><span className="text-muted-foreground">{t("status")}:</span> {analysis.suggestedStatus}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.suggestedTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Variables */}
      {analysis.extractedVariables.length > 0 && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{t("variables")} ({analysis.extractedVariables.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.extractedVariables.map((v) => (
                <Badge key={v.name} variant="secondary" className="text-[10px] font-mono">
                  {`{{${v.name}}}`}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Duplicates */}
      {analysis.duplicateCandidates.length > 0 && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Copy className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{t("similarPrompts")} ({analysis.duplicateCandidates.length})</span>
            </div>
            <div className="space-y-1">
              {analysis.duplicateCandidates.map((d) => (
                <Link
                  key={d.id}
                  href={`/prompts/${d.id}`}
                  className="flex items-center justify-between text-xs hover:bg-accent/50 rounded px-2 py-1"
                >
                  <span className="truncate">{d.title}</span>
                  <Badge variant="outline" className="text-[10px] ml-2 shrink-0">
                    {Math.round(d.similarity * 100)}%
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Module candidates */}
      {analysis.moduleCandidates.length > 0 && !compact && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Puzzle className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{t("moduleCandidates")}</span>
            </div>
            {analysis.moduleCandidates.map((m, i) => (
              <div key={i} className="text-xs bg-muted/50 rounded p-2">
                <Badge variant="outline" className="text-[10px] mb-1">{m.type}</Badge>
                <p className="font-mono">{m.content}</p>
              </div>
            ))}
          </div>
          <Separator />
        </>
      )}

      {/* Matched Rules */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {t("matchedRules")} ({analysis.matchedRules.length})
        </span>
        <div className="flex flex-wrap gap-1">
          {analysis.matchedRules.map((r, i) => (
            <Badge key={i} variant="outline" className="text-[10px] font-mono">
              {r}
            </Badge>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          v{analysis.analysisVersion}
        </p>
      </div>

      {onAnalyze && (
        <Button size="sm" variant="outline" onClick={onAnalyze} disabled={analyzing} className="w-full">
          <Bot className="h-4 w-4 mr-1" />
          {analyzing ? t("analyzing") : t("reanalyze")}
        </Button>
      )}
    </div>
  )
}
