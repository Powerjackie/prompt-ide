import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getAdminDiagnostics, getSettings } from "@/app/actions/settings.actions"
import { getViewerAuthz } from "@/lib/action-auth"
import { AlertTriangle, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react"
import { AdminConsoleEditor } from "@/components/admin/admin-console-editor"
import { ActionLink } from "@/components/ui/action-link"
import { Folio } from "@/components/ui/folio"
import { PageHeader } from "@/components/ui/page-header"
import { PageShell } from "@/components/ui/page-shell"
import { SurfaceCard } from "@/components/ui/surface-card"

export const metadata: Metadata = { title: "Admin | Prompt IDE" }

export default async function AdminPage() {
  const t = await getTranslations("adminConsole")
  const authz = await getViewerAuthz()

  if (!authz.canManageSettings) {
    return (
      <PageShell>
        <SurfaceCard className="max-w-3xl space-y-5">
          <Folio>{t("deniedEyebrow")}</Folio>
          <LockKeyhole className="size-8 text-[var(--verdigris-deep)]" />
          <h1>{t("deniedTitle")}</h1>
          <p className="prose-lab text-muted-foreground">{t("deniedBody")}</p>
          <ActionLink href="/docs" variant="primary">
            {t("readDocs")}
            <ArrowRight className="size-4" />
          </ActionLink>
        </SurfaceCard>
      </PageShell>
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
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <SurfaceCard inset className="flex items-center gap-3 px-4 py-3">
            <ShieldCheck className="size-5 text-[var(--verdigris-deep)]" />
            <div>
              <Folio>{t("roleLabel")}</Folio>
              <div className="font-serif text-xl">{authz.role}</div>
            </div>
          </SurfaceCard>
        }
      />

      {!settings || !diagnostics ? (
        <SurfaceCard className="space-y-4">
          <AlertTriangle className="size-6 text-destructive" />
          <h2>{t("settingsUnavailable")}</h2>
          <p className="prose-lab text-muted-foreground">{settingsUnavailableMessage}</p>
        </SurfaceCard>
      ) : (
        <section className="space-y-4">
          <SurfaceCard inset className="space-y-3">
            <h2 className="inline-flex items-center gap-2 text-2xl">
              <ShieldCheck className="size-5 text-[var(--verdigris-deep)]" />
              {t("liveTitle")}
            </h2>
            <p className="prose-lab text-muted-foreground">{t("liveBody")}</p>
          </SurfaceCard>
          <AdminConsoleEditor initialSettings={settings} initialDiagnostics={diagnostics} />
        </section>
      )}
    </PageShell>
  )
}
