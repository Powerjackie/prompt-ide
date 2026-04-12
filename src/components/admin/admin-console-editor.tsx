"use client"

import { useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  Bot,
  Check,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import {
  getAdminDiagnostics,
  updateAgentSettings,
  updateSettings,
  resetSettings,
} from "@/app/actions/settings.actions"
import { AdminDiagnosticsPanel } from "@/components/admin/admin-diagnostics-panel"
import { AdminResetDialog } from "@/components/admin/admin-reset-dialog"
import { AdminSettingsPortability } from "@/components/admin/admin-settings-portability"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import {
  AGENT_ANALYSIS_DEPTH_VALUES,
  AGENT_PROVIDER_VALUES,
  AGENT_RISK_THRESHOLD_VALUES,
  APP_DEFAULT_MODEL_VALUES,
  APP_DEFAULT_STATUS_VALUES,
  APP_DEFAULT_VIEW_VALUES,
  APP_THEME_VALUES,
  type AdminDiagnostics,
  type AgentSettings,
  type AppSettings,
} from "@/types/settings"

type ThresholdField = "confidenceThreshold" | "similarityThreshold"

interface AdminConsoleEditorProps {
  initialSettings: AppSettings
  initialDiagnostics: AdminDiagnostics
}

function formatThreshold(value: number) {
  return value.toString()
}

export function AdminConsoleEditor({
  initialSettings,
  initialDiagnostics,
}: AdminConsoleEditorProps) {
  const t = useTranslations("adminConsole")
  const { setTheme } = useTheme()
  const [savedSettings, setSavedSettings] = useState(initialSettings)
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics)
  const [workspaceDraft, setWorkspaceDraft] = useState({
    theme: initialSettings.theme,
    defaultView: initialSettings.defaultView,
    defaultModel: initialSettings.defaultModel,
    defaultStatus: initialSettings.defaultStatus,
  })
  const [agentDraft, setAgentDraft] = useState(initialSettings.agent)
  const [thresholdDrafts, setThresholdDrafts] = useState({
    confidenceThreshold: formatThreshold(initialSettings.agent.confidenceThreshold),
    similarityThreshold: formatThreshold(initialSettings.agent.similarityThreshold),
  })
  const [thresholdErrors, setThresholdErrors] = useState<
    Partial<Record<ThresholdField, string>>
  >({})
  const [workspacePending, startWorkspaceTransition] = useTransition()
  const [agentPending, startAgentTransition] = useTransition()
  const [resetPending, startResetTransition] = useTransition()

  const workspaceDirty =
    workspaceDraft.theme !== savedSettings.theme ||
    workspaceDraft.defaultView !== savedSettings.defaultView ||
    workspaceDraft.defaultModel !== savedSettings.defaultModel ||
    workspaceDraft.defaultStatus !== savedSettings.defaultStatus

  const agentDirty = useMemo(() => {
    return (
      agentDraft.enabled !== savedSettings.agent.enabled ||
      agentDraft.autoAnalyze !== savedSettings.agent.autoAnalyze ||
      agentDraft.analyzeOnPaste !== savedSettings.agent.analyzeOnPaste ||
      agentDraft.enableNormalization !== savedSettings.agent.enableNormalization ||
      agentDraft.enableModuleExtraction !== savedSettings.agent.enableModuleExtraction ||
      agentDraft.provider !== savedSettings.agent.provider ||
      agentDraft.analysisDepth !== savedSettings.agent.analysisDepth ||
      agentDraft.riskThreshold !== savedSettings.agent.riskThreshold ||
      thresholdDrafts.confidenceThreshold !==
        formatThreshold(savedSettings.agent.confidenceThreshold) ||
      thresholdDrafts.similarityThreshold !==
        formatThreshold(savedSettings.agent.similarityThreshold)
    )
  }, [agentDraft, savedSettings.agent, thresholdDrafts])

  function syncFromServer(next: AppSettings) {
    setSavedSettings(next)
    setWorkspaceDraft({
      theme: next.theme,
      defaultView: next.defaultView,
      defaultModel: next.defaultModel,
      defaultStatus: next.defaultStatus,
    })
    setAgentDraft(next.agent)
    setThresholdDrafts({
      confidenceThreshold: formatThreshold(next.agent.confidenceThreshold),
      similarityThreshold: formatThreshold(next.agent.similarityThreshold),
    })
    setThresholdErrors({})
  }

  async function refreshDiagnostics() {
    const result = await getAdminDiagnostics()

    if (!result.success) {
      toast.error(result.error || t("diagnostics.refreshFailed"))
      return
    }

    setDiagnostics(result.data)
  }

  function parseThreshold(field: ThresholdField, raw: string) {
    const value = Number(raw)

    if (raw.trim() === "" || Number.isNaN(value) || value < 0 || value > 1) {
      return { ok: false as const, error: t("validation.thresholdRange") }
    }

    return { ok: true as const, value }
  }

  function buildAgentPayload() {
    const confidence = parseThreshold(
      "confidenceThreshold",
      thresholdDrafts.confidenceThreshold
    )
    const similarity = parseThreshold(
      "similarityThreshold",
      thresholdDrafts.similarityThreshold
    )

    const nextErrors: Partial<Record<ThresholdField, string>> = {}

    if (!confidence.ok) {
      nextErrors.confidenceThreshold = confidence.error
    }

    if (!similarity.ok) {
      nextErrors.similarityThreshold = similarity.error
    }

    setThresholdErrors(nextErrors)

    if (!confidence.ok || !similarity.ok) {
      toast.error(t("validation.thresholdRange"))
      return null
    }

    return {
      ...agentDraft,
      confidenceThreshold: confidence.value,
      similarityThreshold: similarity.value,
    } satisfies AgentSettings
  }

  function handleWorkspaceSave() {
    if (!workspaceDirty) return

    startWorkspaceTransition(async () => {
      const result = await updateSettings({
        theme: workspaceDraft.theme,
        defaultView: workspaceDraft.defaultView,
        defaultModel: workspaceDraft.defaultModel,
        defaultStatus: workspaceDraft.defaultStatus,
      })

      if (!result.success) {
        toast.error(result.error || t("saveFailed"))
        return
      }

      syncFromServer(result.data)
      setTheme(result.data.theme)
      await refreshDiagnostics()
      toast.success(t("workspace.saved"))
    })
  }

  function handleAgentSave() {
    if (!agentDirty) return

    const payload = buildAgentPayload()
    if (!payload) return

    startAgentTransition(async () => {
      const result = await updateAgentSettings(payload)

      if (!result.success) {
        toast.error(result.error || t("saveFailed"))
        return
      }

      syncFromServer(result.data)
      await refreshDiagnostics()
      toast.success(t("agent.saved"))
    })
  }

  function handleThresholdCommit() {
    if (!agentDirty || agentPending) return
    handleAgentSave()
  }

  function handleReset() {
    startResetTransition(async () => {
      const result = await resetSettings()

      if (!result.success) {
        toast.error(result.error || t("saveFailed"))
        return
      }

      syncFromServer(result.data)
      setTheme(result.data.theme)
      await refreshDiagnostics()
      toast.success(t("danger.resetDone"))
    })
  }

  function handleImported(next: AppSettings, nextDiagnostics: AdminDiagnostics) {
    syncFromServer(next)
    setDiagnostics(nextDiagnostics)
    setTheme(next.theme)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
      <div className="space-y-6">
        <section className="brutal-border-thick brutal-shadow bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                <Settings2 className="h-4 w-4 text-primary" />
                {t("workspace.title")}
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                {t("workspace.description")}
              </p>
            </div>
            <Button
              id="admin-workspace-save"
              type="button"
              onClick={handleWorkspaceSave}
              disabled={workspacePending || !workspaceDirty}
              className="rounded-none border-2 border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]"
            >
              {workspacePending ? t("workspace.pending") : t("workspace.action")}
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-theme" className="font-mono text-xs uppercase tracking-[0.16em]">
                {t("workspace.theme")}
              </Label>
              <Select
                value={workspaceDraft.theme}
                onValueChange={(value) =>
                  value &&
                  setWorkspaceDraft((current) => ({
                    ...current,
                    theme: value as AppSettings["theme"],
                  }))
                }
              >
                <SelectTrigger
                  id="admin-theme"
                  className="h-12 w-full rounded-none border-2 border-border bg-background font-mono text-xs uppercase"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-border">
                  {APP_THEME_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`workspace.themeOptions.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-default-view" className="font-mono text-xs uppercase tracking-[0.16em]">
                {t("workspace.view")}
              </Label>
              <Select
                value={workspaceDraft.defaultView}
                onValueChange={(value) =>
                  value &&
                  setWorkspaceDraft((current) => ({
                    ...current,
                    defaultView: value as AppSettings["defaultView"],
                  }))
                }
              >
                <SelectTrigger
                  id="admin-default-view"
                  className="h-12 w-full rounded-none border-2 border-border bg-background font-mono text-xs uppercase"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-border">
                  {APP_DEFAULT_VIEW_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`workspace.viewOptions.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-default-model" className="font-mono text-xs uppercase tracking-[0.16em]">
                {t("workspace.model")}
              </Label>
              <Select
                value={workspaceDraft.defaultModel}
                onValueChange={(value) =>
                  value &&
                  setWorkspaceDraft((current) => ({
                    ...current,
                    defaultModel: value as AppSettings["defaultModel"],
                  }))
                }
              >
                <SelectTrigger
                  id="admin-default-model"
                  className="h-12 w-full rounded-none border-2 border-border bg-background font-mono text-xs uppercase"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-border">
                  {APP_DEFAULT_MODEL_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`workspace.modelOptions.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-default-status" className="font-mono text-xs uppercase tracking-[0.16em]">
                {t("workspace.status")}
              </Label>
              <Select
                value={workspaceDraft.defaultStatus}
                onValueChange={(value) =>
                  value &&
                  setWorkspaceDraft((current) => ({
                    ...current,
                    defaultStatus: value as AppSettings["defaultStatus"],
                  }))
                }
              >
                <SelectTrigger
                  id="admin-default-status"
                  className="h-12 w-full rounded-none border-2 border-border bg-background font-mono text-xs uppercase"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-border">
                  {APP_DEFAULT_STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`workspace.statusOptions.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="brutal-border-thick brutal-shadow bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                <Bot className="h-4 w-4 text-primary" />
                {t("agent.title")}
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                {t("agent.description")}
              </p>
            </div>
            <Button
              id="admin-agent-save"
              type="button"
              onClick={handleAgentSave}
              disabled={agentPending || !agentDirty}
              className="rounded-none border-2 border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]"
            >
              {agentPending ? t("agent.pending") : t("agent.action")}
            </Button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="brutal-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="agent-enabled" className="font-mono text-xs uppercase tracking-[0.16em]">
                      {t("agent.enabled")}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t("agent.enabledHelp")}</p>
                  </div>
                  <Switch
                    id="agent-enabled"
                    checked={agentDraft.enabled}
                    onCheckedChange={(value) =>
                      setAgentDraft((current) => ({ ...current, enabled: Boolean(value) }))
                    }
                  />
                </div>
              </div>

              <div className="brutal-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="agent-auto-analyze" className="font-mono text-xs uppercase tracking-[0.16em]">
                      {t("agent.autoAnalyze")}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t("agent.autoAnalyzeHelp")}</p>
                  </div>
                  <Switch
                    id="agent-auto-analyze"
                    checked={agentDraft.autoAnalyze}
                    onCheckedChange={(value) =>
                      setAgentDraft((current) => ({ ...current, autoAnalyze: Boolean(value) }))
                    }
                  />
                </div>
              </div>

              <div className="brutal-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="agent-paste" className="font-mono text-xs uppercase tracking-[0.16em]">
                      {t("agent.analyzeOnPaste")}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t("agent.analyzeOnPasteHelp")}</p>
                  </div>
                  <Switch
                    id="agent-paste"
                    checked={agentDraft.analyzeOnPaste}
                    onCheckedChange={(value) =>
                      setAgentDraft((current) => ({
                        ...current,
                        analyzeOnPaste: Boolean(value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="brutal-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="agent-normalization" className="font-mono text-xs uppercase tracking-[0.16em]">
                      {t("agent.enableNormalization")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("agent.enableNormalizationHelp")}
                    </p>
                  </div>
                  <Switch
                    id="agent-normalization"
                    checked={agentDraft.enableNormalization}
                    onCheckedChange={(value) =>
                      setAgentDraft((current) => ({
                        ...current,
                        enableNormalization: Boolean(value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="brutal-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="agent-module-extraction" className="font-mono text-xs uppercase tracking-[0.16em]">
                      {t("agent.enableModuleExtraction")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("agent.enableModuleExtractionHelp")}
                    </p>
                  </div>
                  <Switch
                    id="agent-module-extraction"
                    checked={agentDraft.enableModuleExtraction}
                    onCheckedChange={(value) =>
                      setAgentDraft((current) => ({
                        ...current,
                        enableModuleExtraction: Boolean(value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-provider" className="font-mono text-xs uppercase tracking-[0.16em]">
                  {t("agent.provider")}
                </Label>
                <Select
                  value={agentDraft.provider}
                  onValueChange={(value) =>
                    value &&
                    setAgentDraft((current) => ({
                      ...current,
                      provider: value as AgentSettings["provider"],
                    }))
                  }
                >
                  <SelectTrigger
                    id="agent-provider"
                    className="h-12 w-full rounded-none border-2 border-border bg-background font-mono text-xs uppercase"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-border">
                    {AGENT_PROVIDER_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`agent.providerOptions.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-depth" className="font-mono text-xs uppercase tracking-[0.16em]">
                  {t("agent.depth")}
                </Label>
                <Select
                  value={agentDraft.analysisDepth}
                  onValueChange={(value) =>
                    value &&
                    setAgentDraft((current) => ({
                      ...current,
                      analysisDepth: value as AgentSettings["analysisDepth"],
                    }))
                  }
                >
                  <SelectTrigger
                    id="agent-depth"
                    className="h-12 w-full rounded-none border-2 border-border bg-background font-mono text-xs uppercase"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-border">
                    {AGENT_ANALYSIS_DEPTH_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`agent.depthOptions.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-risk" className="font-mono text-xs uppercase tracking-[0.16em]">
                  {t("agent.riskThreshold")}
                </Label>
                <Select
                  value={agentDraft.riskThreshold}
                  onValueChange={(value) =>
                    value &&
                    setAgentDraft((current) => ({
                      ...current,
                      riskThreshold: value as AgentSettings["riskThreshold"],
                    }))
                  }
                >
                  <SelectTrigger
                    id="agent-risk"
                    className="h-12 w-full rounded-none border-2 border-border bg-background font-mono text-xs uppercase"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-border">
                    {AGENT_RISK_THRESHOLD_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`agent.riskOptions.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-confidence" className="font-mono text-xs uppercase tracking-[0.16em]">
                  {t("agent.confidenceThreshold")}
                </Label>
                <Input
                  id="agent-confidence"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  inputMode="decimal"
                  value={thresholdDrafts.confidenceThreshold}
                  onChange={(event) => {
                    const value = event.target.value
                    setThresholdDrafts((current) => ({
                      ...current,
                      confidenceThreshold: value,
                    }))
                    setThresholdErrors((current) => ({
                      ...current,
                      confidenceThreshold: undefined,
                    }))
                  }}
                  onBlur={handleThresholdCommit}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleThresholdCommit()
                    }
                  }}
                  className="h-12 rounded-none border-2 border-border bg-background font-mono text-sm"
                />
                {thresholdErrors.confidenceThreshold ? (
                  <p className="text-xs font-medium text-destructive">
                    {thresholdErrors.confidenceThreshold}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("agent.thresholdHelp")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-similarity" className="font-mono text-xs uppercase tracking-[0.16em]">
                  {t("agent.similarityThreshold")}
                </Label>
                <Input
                  id="agent-similarity"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  inputMode="decimal"
                  value={thresholdDrafts.similarityThreshold}
                  onChange={(event) => {
                    const value = event.target.value
                    setThresholdDrafts((current) => ({
                      ...current,
                      similarityThreshold: value,
                    }))
                    setThresholdErrors((current) => ({
                      ...current,
                      similarityThreshold: undefined,
                    }))
                  }}
                  onBlur={handleThresholdCommit}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleThresholdCommit()
                    }
                  }}
                  className="h-12 rounded-none border-2 border-border bg-background font-mono text-sm"
                />
                {thresholdErrors.similarityThreshold ? (
                  <p className="text-xs font-medium text-destructive">
                    {thresholdErrors.similarityThreshold}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("agent.thresholdHelp")}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="brutal-border-thick bg-card p-5 sm:p-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {t("danger.title")}
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("danger.body")}</p>
          <div className="mt-5">
            <AdminResetDialog pending={resetPending} onConfirm={handleReset} />
          </div>
        </section>

        <AdminSettingsPortability
          settings={savedSettings}
          onImported={handleImported}
        />
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="brutal-border bg-foreground p-5 text-background">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-background/70">
            <Check className="h-4 w-4 text-primary" />
            {t("sync.title")}
          </div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-background/85">
            <p>{t("sync.body")}</p>
            <div className="border-2 border-background/20 px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.16em]">
              {workspaceDirty || agentDirty ? t("sync.pending") : t("sync.clean")}
            </div>
          </div>
        </section>

        <section className="brutal-border bg-card p-5">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t("guards.title")}
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("guards.body")}</p>
          <div className="mt-5 border-2 border-border bg-muted px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.16em]">
            {t("guards.ensureAdmin")}
          </div>
        </section>

        <section className="brutal-border bg-card p-5">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            {t("notes.title")}
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
            <li>{t("notes.workspace")}</li>
            <li>{t("notes.agent")}</li>
            <li>{t("notes.reset")}</li>
          </ul>
        </section>

        <AdminDiagnosticsPanel diagnostics={diagnostics} />
      </aside>
    </div>
  )
}
