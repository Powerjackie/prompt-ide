import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowRight, BookOpen, FileText, FlaskConical, Home, LockKeyhole, PenSquare, Puzzle, ShieldCheck } from "lucide-react"
import { Folio } from "@/components/ui/folio"
import { PageHeader } from "@/components/ui/page-header"
import { PageShell } from "@/components/ui/page-shell"
import { SurfaceCard } from "@/components/ui/surface-card"

export const metadata: Metadata = { title: "Docs | Prompt IDE" }

const workflowItems = [
  { key: "home", href: "/", icon: Home, current: false },
  { key: "playground", href: "/playground", icon: FlaskConical, current: false },
  { key: "prompts", href: "/prompts", icon: FileText, current: false },
  { key: "editor", href: "/editor", icon: PenSquare, current: false },
  { key: "modules", href: "/modules", icon: Puzzle, current: false },
  { key: "docs", href: "/docs", icon: BookOpen, current: true },
  { key: "admin", href: "/admin", icon: ShieldCheck, current: false },
] as const

const liveRouteKeys = ["root", "login", "playground", "prompts", "promptDetail", "editor", "editorDetail", "modules", "docs", "admin"] as const
const adminPointKeys = ["liveRoute", "memberDenied", "serverGuard", "settingsAbsent"] as const
const hydrationKeys = ["promptsDesktop", "promptsMobile", "editorNew", "editorExisting", "createPrompt", "agentEnabled"] as const
const playgroundKeys = ["stateless", "smokeBaseline", "deepAcceptance"] as const
const verificationKeys = ["smokeCoverage", "excludedSuccessPath", "port"] as const
const removedKeys = ["settings", "skills", "oldDocs", "collections", "archive", "favorites", "inbox", "tags"] as const

export default async function DocsPage() {
  const t = await getTranslations("docsSurface")

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <SurfaceCard className="space-y-4">
          <Folio>surface</Folio>
          <h2>{t("productSurface.title")}</h2>
          <p className="prose-lab text-muted-foreground">{t("productSurface.body")}</p>
          <div className="flex flex-wrap gap-2">
            {liveRouteKeys.map((key) => (
              <span key={key} className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs">
                {t(`productSurface.liveRoutes.${key}`)}
              </span>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-4 bg-[var(--paper-deep)]">
          <LockKeyhole className="size-6 text-[var(--verdigris-deep)]" />
          <h2>{t("adminPermissions.title")}</h2>
          <p className="ui-body text-muted-foreground">{t("adminPermissions.body")}</p>
          <ul className="space-y-3 text-sm">
            {adminPointKeys.map((key) => (
              <li key={key} className="border-t border-border pt-3">
                {t(`adminPermissions.items.${key}`)}
              </li>
            ))}
          </ul>
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <Folio>verification</Folio>
          <h2>{t("verification.title")}</h2>
          <p className="ui-body text-muted-foreground">{t("verification.body")}</p>
          <ul className="space-y-3 text-sm">
            {verificationKeys.map((key) => (
              <li key={key} className="border-t border-border pt-3">
                {t(`verification.items.${key}`)}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </section>

      <section className="space-y-4">
        <div className="max-w-3xl space-y-3">
          <h2>{t("workflowSection.title")}</h2>
          <p className="prose-lab text-muted-foreground">{t("workflowSection.body")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflowItems.map((item) => {
            const Icon = item.icon
            const card = (
              <SurfaceCard interactive={!item.current} className="flex min-h-52 flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="size-5 text-[var(--verdigris-deep)]" />
                    {item.current ? <Folio>{t("currentPage")}</Folio> : <ArrowRight className="size-5" />}
                  </div>
                  <div className="space-y-2">
                    <h3>{t(`workflow.${item.key}.title`)}</h3>
                    <p className="ui-body text-muted-foreground">{t(`workflow.${item.key}.description`)}</p>
                  </div>
                </div>
                <Folio>{item.current ? t("currentPage") : t("open")}</Folio>
              </SurfaceCard>
            )
            return item.current ? (
              <div key={item.key}>{card}</div>
            ) : (
              <Link key={item.key} href={item.href} className="block no-underline">
                {card}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <SurfaceCard className="space-y-4">
          <h2>{t("settingsHydration.title")}</h2>
          <p className="prose-lab text-muted-foreground">{t("settingsHydration.body")}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {hydrationKeys.map((key) => (
              <li key={key} className="rounded-[var(--radius-sm)] border border-border bg-muted px-4 py-4 text-sm">
                {t(`settingsHydration.items.${key}`)}
              </li>
            ))}
          </ul>
        </SurfaceCard>

        <div className="space-y-4">
          <SurfaceCard className="space-y-4">
            <h2>{t("playgroundContract.title")}</h2>
            <p className="ui-body text-muted-foreground">{t("playgroundContract.body")}</p>
            <ul className="space-y-3 text-sm">
              {playgroundKeys.map((key) => (
                <li key={key} className="border-t border-border pt-3">
                  {t(`playgroundContract.items.${key}`)}
                </li>
              ))}
            </ul>
          </SurfaceCard>
          <SurfaceCard className="space-y-4">
            <h2>{t("removed.title")}</h2>
            <p className="ui-body text-muted-foreground">{t("removed.body")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {removedKeys.map((key) => (
                <div key={key} className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-3 font-mono text-xs">
                  {t(`removed.items.${key}`)}
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </PageShell>
  )
}
