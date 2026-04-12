import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export const metadata: Metadata = { title: "Admin | Prompt IDE" }
import { Link } from "@/i18n/navigation"
import { getAdminDiagnostics, getSettings } from "@/app/actions/settings.actions"
import { getViewerAuthz } from "@/lib/action-auth"
import { AlertTriangle, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react"
import { AdminConsoleEditor } from "@/components/admin/admin-console-editor"

export default async function AdminPage() {
  const t = await getTranslations("adminConsole")
  const authz = await getViewerAuthz()

  if (!authz.canManageSettings) {
    return (
      <div className="space-y-6">
        <section className="brutal-border-thick brutal-shadow-lg bg-card p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex border-2 border-border bg-background px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.18em]">
              {t("deniedEyebrow")}
            </span>
            <LockKeyhole className="h-10 w-10 text-primary" />
            <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl">
              {t("deniedTitle")}
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">{t("deniedBody")}</p>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 border-2 border-border bg-foreground px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-background shadow-[4px_4px_0_0_var(--border)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              data-magnet-target
            >
              {t("readDocs")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const settingsResult = await getSettings()
  const diagnosticsResult = await getAdminDiagnostics()
  const settings = settingsResult.success ? settingsResult.data : null
  const diagnostics = diagnosticsResult.success ? diagnosticsResult.data : null
  const settingsUnavailableMessage =
    settingsResult.success && diagnosticsResult.success
      ? t("settingsUnavailableBody")
      : settingsResult.success
        ? diagnosticsResult.success
          ? t("settingsUnavailableBody")
          : diagnosticsResult.error
        : settingsResult.error

  return (
    <div className="space-y-8">
      <section className="brutal-border-thick brutal-shadow-lg bg-card p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div className="max-w-4xl space-y-5">
            <span className="inline-flex border-2 border-border bg-primary px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">
              {t("eyebrow")}
            </span>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{t("description")}</p>
          </div>
          <div className="brutal-border bg-foreground p-5 text-background">
            <ShieldCheck className="mb-4 h-8 w-8 text-primary" />
            <div className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-background/70">
              {t("roleLabel")}
            </div>
            <div className="mt-2 text-3xl font-black uppercase">{authz.role}</div>
          </div>
        </div>
      </section>

      {!settings || !diagnostics ? (
        <section className="brutal-border bg-card p-6">
          <AlertTriangle className="mb-4 h-6 w-6 text-destructive" />
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">
            {t("settingsUnavailable")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{settingsUnavailableMessage}</p>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="brutal-border bg-foreground p-5 text-background">
            <h2 className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-background/70">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t("liveTitle")}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-background/85">
              {t("liveBody")}
            </p>
          </div>

          <AdminConsoleEditor
            initialSettings={settings}
            initialDiagnostics={diagnostics}
          />
        </section>
      )}
    </div>
  )
}
