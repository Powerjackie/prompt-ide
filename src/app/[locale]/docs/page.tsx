import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export const metadata: Metadata = { title: "Docs | Prompt IDE" }
import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  BookOpen,
  FileText,
  FlaskConical,
  Home,
  LockKeyhole,
  PenSquare,
  Puzzle,
  ShieldCheck,
} from "lucide-react"
import { BrutalCard } from "@/components/ui/brutal-card"

const workflowItems = [
  { key: "home", href: "/", icon: Home, current: false },
  { key: "playground", href: "/playground", icon: FlaskConical, current: false },
  { key: "prompts", href: "/prompts", icon: FileText, current: false },
  { key: "editor", href: "/editor", icon: PenSquare, current: false },
  { key: "modules", href: "/modules", icon: Puzzle, current: false },
  { key: "docs", href: "/docs", icon: BookOpen, current: true },
  { key: "admin", href: "/admin", icon: ShieldCheck, current: false },
] as const

const liveRouteKeys = [
  "root",
  "login",
  "playground",
  "prompts",
  "promptDetail",
  "editor",
  "editorDetail",
  "modules",
  "docs",
  "admin",
] as const

const adminPointKeys = ["liveRoute", "memberDenied", "serverGuard", "settingsAbsent"] as const

const hydrationKeys = [
  "promptsDesktop",
  "promptsMobile",
  "editorNew",
  "editorExisting",
  "createPrompt",
  "agentEnabled",
] as const

const playgroundKeys = ["stateless", "smokeBaseline", "deepAcceptance"] as const
const verificationKeys = ["smokeCoverage", "excludedSuccessPath", "port"] as const
const removedKeys = [
  "settings",
  "skills",
  "oldDocs",
  "collections",
  "archive",
  "favorites",
  "inbox",
  "tags",
] as const

export default async function DocsPage() {
  const t = await getTranslations("docsSurface")

  return (
    <div className="space-y-8">
      <BrutalCard as="section" border="thick" shadow="lg" padding="xl">
        <div className="max-w-5xl space-y-6">
          <span className="inline-flex border-2 border-border bg-primary px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">
            {t("eyebrow")}
          </span>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="max-w-4xl text-lg leading-8 text-muted-foreground">{t("description")}</p>
          </div>
        </div>
      </BrutalCard>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <BrutalCard border="thick" shadow="lg" padding="lg">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">
            {t("productSurface.title")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("productSurface.body")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {liveRouteKeys.map((key) => (
              <span
                key={key}
                className="border-2 border-border bg-background px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em]"
              >
                {t(`productSurface.liveRoutes.${key}`)}
              </span>
            ))}
          </div>
        </BrutalCard>

        <div className="brutal-border bg-foreground p-6 text-background">
          <LockKeyhole className="mb-5 h-8 w-8 text-primary" />
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">
            {t("adminPermissions.title")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-background/80">{t("adminPermissions.body")}</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-background">
            {adminPointKeys.map((key) => (
              <li key={key} className="border-t border-background/20 pt-3">
                {t(`adminPermissions.items.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <BrutalCard shadow="none" padding="lg">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">
            {t("verification.title")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("verification.body")}</p>
          <ul className="mt-5 space-y-3 text-sm leading-6">
            {verificationKeys.map((key) => (
              <li key={key} className="border-t border-border pt-3">
                {t(`verification.items.${key}`)}
              </li>
            ))}
          </ul>
        </BrutalCard>
      </section>

      <section className="space-y-4">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em]">
            {t("workflowSection.title")}
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">{t("workflowSection.body")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflowItems.map((item) => {
            const Icon = item.icon

            const content = (
              <>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="border-2 border-border bg-background p-2">
                      <Icon className="h-5 w-5" />
                    </span>
                    {item.current ? (
                      <span className="border-2 border-border bg-primary px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                        {t("currentPage")}
                      </span>
                    ) : (
                      <ArrowRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-[-0.03em]">
                      {t(`workflow.${item.key}.title`)}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t(`workflow.${item.key}.description`)}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.16em]">
                  {item.current ? t("currentPage") : t("open")}
                </span>
              </>
            )

            if (item.current) {
              return (
                <BrutalCard
                  key={item.key}
                  shadow="default"
                  className="flex min-h-52 flex-col justify-between"
                >
                  {content}
                </BrutalCard>
              )
            }

            return (
              <BrutalCard
                key={item.key}
                shadow="default"
                hover="shift"
                className="flex min-h-52 flex-col justify-between"
              >
                <Link
                  href={item.href}
                  className="flex flex-1 flex-col justify-between"
                  data-magnet-target
                >
                  {content}
                </Link>
              </BrutalCard>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <BrutalCard border="thick" shadow="none" padding="lg">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">
            {t("settingsHydration.title")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("settingsHydration.body")}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {hydrationKeys.map((key) => (
              <li
                key={key}
                className="border-2 border-border bg-muted px-4 py-4 text-sm leading-6"
              >
                {t(`settingsHydration.items.${key}`)}
              </li>
            ))}
          </ul>
        </BrutalCard>

        <div className="space-y-4">
          <BrutalCard shadow="none" padding="lg">
            <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">
              {t("playgroundContract.title")}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("playgroundContract.body")}
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-6">
              {playgroundKeys.map((key) => (
                <li key={key} className="border-t border-border pt-3">
                  {t(`playgroundContract.items.${key}`)}
                </li>
              ))}
            </ul>
          </BrutalCard>

          <BrutalCard shadow="none" padding="lg">
            <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">
              {t("removed.title")}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("removed.body")}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {removedKeys.map((key) => (
                <div
                  key={key}
                  className="border-2 border-border bg-background px-3 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em]"
                >
                  {t(`removed.items.${key}`)}
                </div>
              ))}
            </div>
          </BrutalCard>
        </div>
      </section>
    </div>
  )
}
