import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  Bot,
  FileText,
  FlaskConical,
  GitBranch,
  Home,
  Layers,
  PenSquare,
  Puzzle,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Folio } from "@/components/ui/folio"
import { PageHeader } from "@/components/ui/page-header"
import { PageShell } from "@/components/ui/page-shell"
import { SurfaceCard } from "@/components/ui/surface-card"

export const metadata: Metadata = { title: "Docs | Prompt IDE" }

const quickStartSteps = ["browse", "edit", "variable", "module", "test"] as const

const conceptItems = [
  { key: "prompts", icon: FileText },
  { key: "variables", icon: Sparkles },
  { key: "modules", icon: Puzzle },
  { key: "versions", icon: GitBranch },
  { key: "agent", icon: Bot },
] as const

const workflowItems = [
  { key: "home", href: "/", icon: Home },
  { key: "playground", href: "/playground", icon: FlaskConical },
  { key: "prompts", href: "/prompts", icon: FileText },
  { key: "editor", href: "/editor", icon: PenSquare },
  { key: "modules", href: "/modules", icon: Puzzle },
  { key: "admin", href: "/admin", icon: ShieldCheck },
] as const

const faqKeys = ["new", "variables", "save", "model", "backup"] as const

export default async function DocsPage() {
  const t = await getTranslations("docsSurface")

  return (
    <PageShell width="wide" className="space-y-10">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      {/* Quick start */}
      <section className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <h2>{t("quickStart.title")}</h2>
          <p className="prose-lab text-muted-foreground">{t("quickStart.body")}</p>
        </div>
        <SurfaceCard className="space-y-0 p-6 sm:p-7">
          <ol className="space-y-0">
            {quickStartSteps.map((key, idx) => (
              <li
                key={key}
                className="flex gap-5 border-t border-border pt-5 first:border-t-0 first:pt-0 [&:not(:last-child)]:pb-5"
              >
                <span className="pt-0.5 font-mono text-sm tabular-nums text-[var(--verdigris-deep)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold tracking-tight">
                    {t(`quickStart.steps.${key}.title`)}
                  </h3>
                  <p className="ui-body text-muted-foreground">
                    {t(`quickStart.steps.${key}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SurfaceCard>
      </section>

      {/* Core concepts */}
      <section className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <h2>{t("concepts.title")}</h2>
          <p className="prose-lab text-muted-foreground">{t("concepts.body")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {conceptItems.map(({ key, icon: Icon }) => (
            <SurfaceCard key={key} className="space-y-3">
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-[var(--verdigris-deep)]" />
                <Folio>{t(`concepts.items.${key}.label`)}</Folio>
              </div>
              <h3>{t(`concepts.items.${key}.title`)}</h3>
              <p className="ui-body text-muted-foreground">
                {t(`concepts.items.${key}.body`)}
              </p>
            </SurfaceCard>
          ))}
        </div>
      </section>

      {/* Surface index */}
      <section className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <h2>{t("workflowSection.title")}</h2>
          <p className="prose-lab text-muted-foreground">{t("workflowSection.body")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflowItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.key} href={item.href} className="block no-underline">
                <SurfaceCard interactive className="flex min-h-44 flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Icon className="size-5 text-[var(--verdigris-deep)]" />
                      <ArrowRight className="size-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3>{t(`workflow.${item.key}.title`)}</h3>
                      <p className="ui-body text-muted-foreground">
                        {t(`workflow.${item.key}.description`)}
                      </p>
                    </div>
                  </div>
                  <Folio>{t("open")}</Folio>
                </SurfaceCard>
              </Link>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <h2>{t("faq.title")}</h2>
          <p className="prose-lab text-muted-foreground">{t("faq.body")}</p>
        </div>
        <SurfaceCard className="space-y-0 p-6 sm:p-7">
          <ul className="space-y-0">
            {faqKeys.map((key) => (
              <li
                key={key}
                className="space-y-2 border-t border-border pt-5 first:border-t-0 first:pt-0 [&:not(:last-child)]:pb-5"
              >
                <h3 className="text-base font-semibold tracking-tight">
                  {t(`faq.items.${key}.q`)}
                </h3>
                <p className="ui-body text-muted-foreground">
                  {t(`faq.items.${key}.a`)}
                </p>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </section>

      {/* Self-host note */}
      <section>
        <SurfaceCard className="space-y-3 bg-[var(--paper-deep)]">
          <div className="flex items-center justify-between">
            <Layers className="size-5 text-[var(--verdigris-deep)]" />
            <Folio>{t("selfHost.label")}</Folio>
          </div>
          <h2>{t("selfHost.title")}</h2>
          <p className="prose-lab text-muted-foreground">{t("selfHost.body")}</p>
        </SurfaceCard>
      </section>
    </PageShell>
  )
}
