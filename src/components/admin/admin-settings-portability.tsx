"use client"

import { useMemo, useState, useTransition } from "react"
import { AlertTriangle, Check, Copy, Download, FileJson } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  replaceSettings,
  validateSettingsImport,
} from "@/app/actions/settings.actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AdminDiagnostics, AppSettings } from "@/types/settings"

interface AdminSettingsPortabilityProps {
  settings: AppSettings
  onImported: (settings: AppSettings, diagnostics: AdminDiagnostics) => void
}

function serializeSettings(settings: AppSettings) {
  return JSON.stringify(settings, null, 2)
}

export function AdminSettingsPortability({
  settings,
  onImported,
}: AdminSettingsPortabilityProps) {
  const t = useTranslations("adminConsole")
  const [importText, setImportText] = useState(() => serializeSettings(settings))
  const [validatedSnapshot, setValidatedSnapshot] = useState<string | null>(null)
  const [validatedSettings, setValidatedSettings] = useState<AppSettings | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [validatePending, startValidateTransition] = useTransition()
  const [importPending, startImportTransition] = useTransition()

  const exportJson = useMemo(() => serializeSettings(settings), [settings])
  const currentPayloadValidated = validatedSnapshot === importText && validatedSettings !== null

  function handleTextChange(next: string) {
    setImportText(next)
    setValidatedSnapshot(null)
    setValidatedSettings(null)
    setErrorText(null)
  }

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(exportJson)
      toast.success(t("portability.copySuccess"))
    } catch {
      toast.error(t("portability.copyFailed"))
    }
  }

  function handleDownloadJson() {
    const blob = new Blob([exportJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "prompt-ide-settings.json"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function handleValidate() {
    startValidateTransition(async () => {
      const result = await validateSettingsImport(importText)

      if (!result.success) {
        setErrorText(result.error)
        setValidatedSnapshot(null)
        setValidatedSettings(null)
        toast.error(result.error || t("portability.validateFailed"))
        return
      }

      setValidatedSnapshot(importText)
      setValidatedSettings(result.data)
      setErrorText(null)
      toast.success(t("portability.validateSuccess"))
    })
  }

  function handleImport() {
    if (!currentPayloadValidated) {
      const message = t("portability.validateFirst")
      setErrorText(message)
      toast.error(message)
      return
    }

    startImportTransition(async () => {
      const result = await replaceSettings(importText)

      if (!result.success) {
        setErrorText(result.error)
        toast.error(result.error || t("portability.importFailed"))
        return
      }

      const nextSettings = result.data.settings
      setErrorText(null)
      setValidatedSnapshot(serializeSettings(nextSettings))
      setValidatedSettings(nextSettings)
      setImportText(serializeSettings(nextSettings))
      onImported(nextSettings, result.data.diagnostics)
      toast.success(t("portability.importSuccess"))
    })
  }

  return (
    <section
      id="admin-portability"
      className="lab-card bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-medium text-muted-foreground">
            <FileJson className="h-4 w-4 text-primary" />
            {t("portability.title")}
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            {t("portability.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            id="admin-export-copy"
            type="button"
            onClick={handleCopyJson}
            className="rounded-none border-2 border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]"
          >
            <Copy className="h-4 w-4" />
            {t("portability.copy")}
          </Button>
          <Button
            id="admin-export-download"
            type="button"
            onClick={handleDownloadJson}
            className="rounded-none border-2 border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]"
          >
            <Download className="h-4 w-4" />
            {t("portability.download")}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Label
          htmlFor="admin-import-text"
          className="font-mono text-xs uppercase tracking-[0.16em]"
        >
          {t("portability.importLabel")}
        </Label>
        <Textarea
          id="admin-import-text"
          value={importText}
          onChange={(event) => handleTextChange(event.target.value)}
          className="min-h-[15rem] rounded-none border-2 border-border bg-background font-mono text-xs leading-6"
        />
        {errorText ? (
          <p
            id="admin-import-error"
            className="text-sm font-medium text-destructive"
          >
            {errorText}
          </p>
        ) : (
          <p className="text-xs leading-6 text-muted-foreground">
            {t("portability.importHelp")}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          id="admin-import-validate"
          type="button"
          onClick={handleValidate}
          disabled={validatePending || importPending}
          className="rounded-none border-2 border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]"
        >
          {validatePending ? t("portability.validating") : t("portability.validate")}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                id="admin-import-trigger"
                type="button"
                disabled={importPending || validatePending || !currentPayloadValidated}
                className="rounded-none border-2 border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]"
              />
            }
          >
            {importPending ? t("portability.importing") : t("portability.import")}
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-none border-2 border-border bg-card shadow-[8px_8px_0_0_var(--border)]">
            <AlertDialogHeader>
              <AlertDialogMedia className="rounded-none bg-primary/10 text-primary">
                <AlertTriangle className="h-5 w-5" />
              </AlertDialogMedia>
              <AlertDialogTitle className="font-mono text-sm font-black uppercase tracking-[0.14em]">
                {t("portability.confirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="leading-7">
                {t("portability.confirmBody")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="rounded-none border-t-2 border-border bg-muted/30">
              <AlertDialogCancel className="rounded-none border-2 border-border font-mono text-xs uppercase tracking-[0.16em]">
                {t("portability.confirmCancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                id="admin-import-confirm"
                onClick={handleImport}
                className="rounded-none border-2 border-border font-mono text-xs uppercase tracking-[0.16em]"
              >
                {t("portability.confirmAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {validatedSettings ? (
        <div className="mt-5 rounded-[var(--radius-sm)] border border-border bg-foreground p-4 text-background">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-background/70">
            <Check className="h-3.5 w-3.5 text-primary" />
            {t("portability.validatedTitle")}
          </div>
          <dl className="mt-3 space-y-2 text-sm leading-7 text-background/85">
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.view")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t(`workspace.viewOptions.${validatedSettings.defaultView}`)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.model")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t(`workspace.modelOptions.${validatedSettings.defaultModel}`)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.status")}</dt>
              <dd className="font-mono text-xs uppercase">
                {t(`workspace.statusOptions.${validatedSettings.defaultStatus}`)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>{t("diagnostics.defaults.agentEnabled")}</dt>
              <dd className="font-mono text-xs uppercase">
                {validatedSettings.agent.enabled
                  ? t("diagnostics.values.enabled")
                  : t("diagnostics.values.disabled")}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  )
}

