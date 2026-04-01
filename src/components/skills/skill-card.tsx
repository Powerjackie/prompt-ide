"use client"

import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { CheckCircle2, Clock3, Gauge, Layers3, Sparkles, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { getSkillHealthVariant } from "@/lib/skill-health"
import type { SkillListItem } from "@/types/skill"

interface SkillCardProps {
  skill: SkillListItem
}

export function SkillCard({ skill }: SkillCardProps) {
  const t = useTranslations("skills")
  const healthVariant = getSkillHealthVariant(skill.health.state)

  return (
    <Link href={`/skills/${skill.id}`}>
      <Card className="h-full rounded-[1.75rem] border-border/70 bg-card/92 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_28px_80px_-40px_rgba(79,70,229,0.4)]">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{skill.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {skill.description || skill.goal || t("noDescription")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="outline">{t(`status.${skill.status}`)}</Badge>
              <Badge variant={healthVariant}>{t(`health.states.${skill.health.state}`)}</Badge>
            </div>
          </div>
          <div className="chip-row">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {skill.recommendedModel}
            </Badge>
            {skill.collection ? (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <Layers3 className="mr-1 h-3.5 w-3.5" />
                {skill.collection.title}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span>{t("entryPrompt")}</span>
            <span className="max-w-[220px] truncate text-right text-foreground">
              {skill.entryPrompt.title}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>{t("updated")}</span>
            <span>{formatDate(skill.updatedAt)}</span>
          </div>
          <div className="grid gap-2 pt-1 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                {t("health.baselineTitle")}
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {skill.health.baselineVersionNumber
                  ? t("benchmarkVersionLabel", { version: skill.health.baselineVersionNumber })
                  : t("health.missing")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                {t("health.benchmarkTitle")}
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {skill.health.benchmarkScore ?? t("health.missing")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {t("health.recentRunTitle")}
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {skill.health.recentRunRiskLevel
                  ? t("recentRunRisk", { level: skill.health.recentRunRiskLevel })
                  : t("health.missing")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              {skill.health.hasBaseline && skill.health.hasBenchmark && skill.health.hasRecentRun
                ? t("health.headlines.ready")
                : t(`health.notes.${skill.health.state}`)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
