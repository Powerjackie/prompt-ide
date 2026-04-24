"use client"

import { Activity, Database, ShieldCheck, Wrench } from "lucide-react"
import { useTranslations } from "next-intl"
import type { AdminDiagnostics } from "@/types/settings"

interface AdminDiagnosticsPanelProps {
  diagnostics: AdminDiagnostics
}

export function AdminDiagnosticsPanel({
  diagnostics,
}: AdminDiagnosticsPanelProps) {
  const t = useTranslations("adminConsole")

  return (
    <section
      id="admin-diagnostics"
      className="lab-card bg-card p-5"
    >
      <div className="inline-flex items-center gap-2 font-mono text-xs font-medium text-muted-foreground">
        <Activity className="h-4 w-4 text-primary" />
        {t("diagnostics.title")}
      </div>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        {t("diagnostics.description")}
      </p>

      <div className="mt-5 space-y-4">
        <div className="rounded-[var(--radius-sm)] border border-border bg-muted/40 p-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {t("diagnostics.role.title")}
          </div>
          <div className="mt-2 text-lg font-black uppercase">{diagnostics.role}</div>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-border bg-background p-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-primary" />
            {t("diagnostics.storage.title")}
          </div>
          <dl className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.storage.key")}</dt>
              <dd className="font-mono text-xs uppercase">
                {diagnostics.settingsKey}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.storage.rowExists")}</dt>
              <dd className="font-mono text-xs uppercase">
                {diagnostics.settingsRowExists
                  ? t("diagnostics.values.yes")
                  : t("diagnostics.values.no")}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.storage.source")}</dt>
              <dd className="font-mono text-xs uppercase">
                {diagnostics.settingsSource === "persisted"
                  ? t("diagnostics.storage.sourcePersisted")
                  : t("diagnostics.storage.sourceFallback")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-border bg-background p-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-primary" />
            {t("diagnostics.database.title")}
          </div>
          <dl className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.database.provider")}</dt>
              <dd className="font-mono text-xs uppercase">
                {diagnostics.database.provider}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.database.target")}</dt>
              <dd className="font-mono text-xs uppercase">
                {diagnostics.database.targetHint}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.database.mode")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t("diagnostics.database.modeFile")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-border bg-background p-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-muted-foreground">
            <Wrench className="h-3.5 w-3.5 text-primary" />
            {t("diagnostics.defaults.title")}
          </div>
          <dl className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.view")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t(`workspace.viewOptions.${diagnostics.effectiveSummary.defaultView}`)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.model")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t(
                  `workspace.modelOptions.${diagnostics.effectiveSummary.defaultModel}`
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.status")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t(
                  `workspace.statusOptions.${diagnostics.effectiveSummary.defaultStatus}`
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.agentEnabled")}</dt>
              <dd className="font-mono text-xs uppercase">
                {diagnostics.effectiveSummary.agentEnabled
                  ? t("diagnostics.values.enabled")
                  : t("diagnostics.values.disabled")}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.provider")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t(
                  `agent.providerOptions.${diagnostics.effectiveSummary.agentProvider}`
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.depth")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t(`agent.depthOptions.${diagnostics.effectiveSummary.analysisDepth}`)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-border bg-foreground p-4 text-background">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-background/70">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {t("diagnostics.guardrails.title")}
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-background/85">
            <li>
              {diagnostics.guardrails.ensureAdminWriteGuard
                ? t("diagnostics.guardrails.ensureAdmin")
                : ""}
            </li>
            <li>
              {diagnostics.guardrails.settingsRouteAbsent
                ? t("diagnostics.guardrails.settingsAbsent")
                : ""}
            </li>
            <li>
              {diagnostics.guardrails.adminRouteOnly
                ? t("diagnostics.guardrails.adminOnly")
                : ""}
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

