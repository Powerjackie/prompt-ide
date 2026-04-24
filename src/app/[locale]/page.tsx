"use client"

import { useEffect, useMemo, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { ArrowUpRight, FileText, FlaskConical, Layers3, Puzzle } from "lucide-react"
import {
  getRecentVersions,
  type RecentPromptVersion,
} from "@/app/actions/prompt-version.actions"
import {
  getRecentPrompts,
  type SerializedPrompt,
} from "@/app/actions/prompt-surface.actions"
import { ActionLink } from "@/components/ui/action-link"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Folio } from "@/components/ui/folio"
import { PageShell } from "@/components/ui/page-shell"
import { StatusDot } from "@/components/ui/status-dot"
import { SurfaceCard } from "@/components/ui/surface-card"
import { WorkbenchPanel } from "@/components/ui/workbench-panel"

const FEATURE_DEFINITIONS = [
  { id: "playground", href: "/playground", icon: FlaskConical },
  { id: "prompts", href: "/prompts", icon: FileText },
  { id: "modules", href: "/modules", icon: Puzzle },
] as const

function formatDateTime(value: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(value))
}

export default function HomePage() {
  const locale = useLocale()
  const t = useTranslations("home")
  const [recentPrompts, setRecentPrompts] = useState<SerializedPrompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(true)
  const [recentVersions, setRecentVersions] = useState<RecentPromptVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(true)

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  )

  useEffect(() => {
    let cancelled = false
    void getRecentPrompts(4).then((result) => {
      if (cancelled) return
      if (result.success) setRecentPrompts(result.data)
      setPromptsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getRecentVersions(4).then((result) => {
      if (cancelled) return
      if (result.success) setRecentVersions(result.data)
      setVersionsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const featureCards = useMemo(
    () =>
      FEATURE_DEFINITIONS.map((feature) => ({
        ...feature,
        title: t(`landing.features.${feature.id}.title`),
        strap: t(`landing.features.${feature.id}.strap`),
        body: t(`landing.features.${feature.id}.body`),
      })),
    [t]
  )

  return (
    <PageShell width="wide" className="space-y-10">
      <section className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="space-y-6">
          <Eyebrow>{t("landing.kicker")}</Eyebrow>
          <h1 className="max-w-4xl text-balance">{t("landing.title")}</h1>
          <p className="prose-lab text-muted-foreground">{t("landing.body")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ActionLink href="/playground" variant="primary">
              {t("landing.cta.playground")}
              <ArrowUpRight className="size-4" />
            </ActionLink>
            <ActionLink href="/prompts">
              {t("landing.cta.library")}
              <ArrowUpRight className="size-4" />
            </ActionLink>
          </div>
        </div>

        <SurfaceCard className="space-y-4">
          {(["mode", "surface", "rule"] as const).map((item, index) => (
            <div className="border-b border-border pb-4 last:border-b-0 last:pb-0" key={item}>
              <Folio>folio {String(index + 1).padStart(2, "0")}</Folio>
              <div className="mt-2 text-sm text-muted-foreground">
                {t(`landing.meta.${item}.label`)}
              </div>
              <div className="font-serif text-xl text-foreground">
                {t(`landing.meta.${item}.value`)}
              </div>
            </div>
          ))}
        </SurfaceCard>
      </section>

      <section className="space-y-5">
        <div className="max-w-3xl space-y-3">
          <Eyebrow>{t("landing.featureKicker")}</Eyebrow>
          <h2>{t("landing.featureTitle")}</h2>
          <p className="prose-lab text-muted-foreground">{t("landing.featureBody")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon
            return (
              <SurfaceCard interactive className="space-y-5" key={card.href}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Folio>{card.strap}</Folio>
                    <h3 className="mt-2">{card.title}</h3>
                  </div>
                  <Icon className="size-5 text-[var(--verdigris-deep)]" />
                </div>
                <p className="prose-lab text-muted-foreground">{card.body}</p>
                <ActionLink href={card.href}>
                  {t("landing.openAction")}
                  <ArrowUpRight className="size-4" />
                </ActionLink>
              </SurfaceCard>
            )
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <WorkbenchPanel
          folio="continue"
          title={t("landing.workbench.continueTitle")}
          description={t("landing.workbench.continueBody")}
        >
          {promptsLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : recentPrompts.length > 0 ? (
            <div className="space-y-3">
              {recentPrompts.map((prompt) => (
                <Link
                  className="flex items-start justify-between gap-4 rounded-[var(--radius-sm)] border border-border bg-background p-3 no-underline transition-colors hover:bg-accent"
                  href={`/prompts/${prompt.id}`}
                  key={prompt.id}
                >
                  <div className="min-w-0">
                    <div className="truncate font-serif text-lg">{prompt.title}</div>
                    <div className="ui-body text-muted-foreground">
                      {formatDateTime(prompt.updatedAt, dateFormatter)}
                    </div>
                  </div>
                  <StatusDot tone={prompt.status === "archived" ? "archived" : "active"}>
                    {prompt.status}
                  </StatusDot>
                </Link>
              ))}
            </div>
          ) : (
            <SurfaceCard inset>{t("landing.workbench.continueEmpty")}</SurfaceCard>
          )}
        </WorkbenchPanel>

        <div className="space-y-5">
          <WorkbenchPanel folio="versions" title={t("landing.workbench.versionTitle")}>
            {versionsLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : recentVersions.length > 0 ? (
              <div className="space-y-3">
                {recentVersions.map((version) => (
                  <Link
                    className="block rounded-[var(--radius-sm)] border border-border bg-background p-3 no-underline hover:bg-accent"
                    href={`/prompts/${version.promptId}`}
                    key={version.id}
                  >
                    <div className="font-medium">{version.prompt.title}</div>
                    <div className="ui-body mt-1 text-muted-foreground">
                      v{version.versionNumber} · {formatDateTime(version.createdAt, dateFormatter)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <SurfaceCard inset>{t("landing.workbench.versionEmpty")}</SurfaceCard>
            )}
          </WorkbenchPanel>

          <SurfaceCard className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers3 className="size-4 text-[var(--verdigris-deep)]" />
              <h3 className="text-xl">{t("landing.workbench.fastAccessTitle")}</h3>
            </div>
            <div className="grid gap-2">
              <ActionLink href="/playground">{t("landing.workbench.links.playground")}</ActionLink>
              <ActionLink href="/prompts">{t("landing.workbench.links.prompts")}</ActionLink>
              <ActionLink href="/modules">{t("landing.workbench.links.modules")}</ActionLink>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </PageShell>
  )
}
