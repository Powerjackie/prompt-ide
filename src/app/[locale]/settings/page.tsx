"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import {
  Download,
  Gauge,
  RotateCcw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/layout/section-header"
import { useAuthz } from "@/components/auth/authz-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import {
  getSettings,
  resetSettings,
  updateAgentSettings,
  updateSettings,
} from "@/app/actions/settings.actions"
import { createModule, getModules } from "@/app/actions/module.actions"
import { createPrompt, getPrompts } from "@/app/actions/prompt.actions"
import type { SerializedModule } from "@/app/actions/module.actions"
import type { SerializedPrompt } from "@/app/actions/prompt.actions"
import type { AppSettings } from "@/types/settings"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ThemeMode = AppSettings["theme"]

interface ThresholdDraft {
  confidenceThreshold: string
  similarityThreshold: string
}

function SettingsToggleCard({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">{title}</div>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  )
}

function ConsoleField({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const t = useTranslations("settings")
  const tm = useTranslations("models")
  const ts = useTranslations("status")
  const tc = useTranslations("common")
  const { canManageSettings } = useAuthz()
  const { setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [modules, setModules] = useState<SerializedModule[]>([])
  const [importing, setImporting] = useState(false)
  const [pending, startTransition] = useTransition()
  const [thresholdDraft, setThresholdDraft] = useState<ThresholdDraft>({
    confidenceThreshold: "",
    similarityThreshold: "",
  })

  useEffect(() => {
    if (!canManageSettings) {
      return
    }

    getSettings().then((result) => {
      if (result.success) setSettings(result.data)
    })

    getPrompts().then((result) => {
      if (result.success) setPrompts(result.data)
    })

    getModules().then((result) => {
      if (result.success) setModules(result.data)
    })
  }, [canManageSettings])

  useEffect(() => {
    if (!settings) return

    setThresholdDraft({
      confidenceThreshold: settings.agent.confidenceThreshold.toString(),
      similarityThreshold: settings.agent.similarityThreshold.toString(),
    })
  }, [settings])

  const handleWorkspaceUpdate = (data: Partial<AppSettings>) => {
    startTransition(async () => {
      const result = await updateSettings(data)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setSettings(result.data)

      if (data.theme) {
        setTheme(data.theme as ThemeMode)
      }
    })
  }

  const handleAgentUpdate = (data: Partial<AppSettings["agent"]>) => {
    startTransition(async () => {
      const result = await updateAgentSettings(data)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setSettings(result.data)
    })
  }

  const handleThresholdCommit = (key: "confidenceThreshold" | "similarityThreshold") => {
    const rawValue = thresholdDraft[key]
    const parsed = Number(rawValue)

    if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
      toast.error(t("thresholdValidation"))
      setThresholdDraft((current) => ({
        ...current,
        [key]: settings?.agent[key].toString() ?? "0",
      }))
      return
    }

    handleAgentUpdate({ [key]: parsed })
  }

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      prompts,
      modules,
      settings,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `prompt-ide-export-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success(t("exported"))
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImporting(true)

      try {
        const text = await file.text()
        const data = JSON.parse(text) as {
          prompts?: SerializedPrompt[]
          modules?: SerializedModule[]
          settings?: AppSettings
        }

        if (!Array.isArray(data.prompts) && !Array.isArray(data.modules) && !data.settings) {
          toast.error(t("invalidFile"))
          return
        }

        let importedPrompts = 0
        let importedModules = 0

        for (const prompt of data.prompts ?? []) {
          const result = await createPrompt({
            title: prompt.title,
            content: prompt.content,
            description: prompt.description ?? "",
            status: prompt.status ?? "inbox",
            source: prompt.source ?? "",
            model: prompt.model ?? "universal",
            category: prompt.category ?? "general",
            tags: prompt.tags ?? [],
            notes: prompt.notes ?? "",
            variables: prompt.variables ?? [],
            isFavorite: prompt.isFavorite ?? false,
          })

          if (result.success) importedPrompts += 1
        }

        for (const importedModule of data.modules ?? []) {
          const result = await createModule({
            title: importedModule.title,
            type: importedModule.type,
            content: importedModule.content,
            tags: importedModule.tags ?? [],
          })

          if (result.success) importedModules += 1
        }

        if (data.settings) {
          const restoredSettings = await updateSettings(data.settings)
          if (restoredSettings.success) {
            setSettings(restoredSettings.data)
            setTheme(restoredSettings.data.theme)
          }
        }

        const [refreshedPrompts, refreshedModules] = await Promise.all([getPrompts(), getModules()])

        if (refreshedPrompts.success) setPrompts(refreshedPrompts.data)
        if (refreshedModules.success) setModules(refreshedModules.data)

        toast.success(
          t("importSuccess", {
            prompts: importedPrompts,
            modules: importedModules,
          })
        )
      } catch {
        toast.error(t("importError"))
      } finally {
        setImporting(false)
      }
    }

    input.click()
  }

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetSettings()
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setSettings(result.data)
      setTheme(result.data.theme)
      toast.success(t("resetDone"))
    })
  }

  const headerChips = useMemo(() => {
    if (!settings) return []

    return [
      t("summary.theme", { value: t(`themeOptions.${settings.theme}`) }),
      t("summary.view", { value: t(settings.defaultView) }),
      t("summary.model", { value: tm(settings.defaultModel) }),
      t("summary.status", { value: ts(settings.defaultStatus as "inbox" | "production" | "archived") }),
      t("summary.provider", { value: t(`providers.${settings.agent.provider}`) }),
      t("summary.depth", { value: t(settings.agent.analysisDepth) }),
    ]
  }, [settings, t, tm, ts])

  if (!canManageSettings) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </>
          }
          title={t("accessDeniedTitle")}
          description={t("accessDeniedDescription")}
        />

        <section className="app-panel space-y-4 p-6">
          <div className="rounded-[1.75rem] border border-border/60 bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
            {t("accessDeniedBody")}
          </div>
          <Button asChild className="rounded-2xl">
            <Link href="/">{tc("back")}</Link>
          </Button>
        </section>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-8", pending && "pointer-events-none opacity-80")}>
      <PageHeader
        eyebrow={
          <>
            <SettingsIcon className="h-3.5 w-3.5" />
            {t("eyebrow")}
          </>
        }
        title={t("title")}
        description={t("description")}
      >
        <div className="chip-row">
          {headerChips.map((chip) => (
            <Badge
              key={chip}
              variant="outline"
              className="rounded-full border-primary/15 bg-background/70 px-3 py-1"
            >
              {chip}
            </Badge>
          ))}
          {pending ? (
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {t("saving")}
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      <section className="app-panel space-y-6 p-6">
        <SectionHeader
          title={t("workspaceDefaultsTitle")}
          description={t("workspaceDefaultsDescription")}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <ConsoleField label={t("themeLabel")} description={t("themeDescription")}>
            <Select
              value={settings.theme}
              onValueChange={(value) =>
                handleWorkspaceUpdate({ theme: value as ThemeMode })
              }
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{t("themeOptions.system")}</SelectItem>
                <SelectItem value="light">{t("themeOptions.light")}</SelectItem>
                <SelectItem value="dark">{t("themeOptions.dark")}</SelectItem>
              </SelectContent>
            </Select>
          </ConsoleField>

          <ConsoleField label={t("defaultView")} description={t("defaultViewDescription")}>
            <Select
              value={settings.defaultView}
              onValueChange={(value) =>
                handleWorkspaceUpdate({ defaultView: value as "card" | "list" })
              }
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">{t("card")}</SelectItem>
                <SelectItem value="list">{t("list")}</SelectItem>
              </SelectContent>
            </Select>
          </ConsoleField>

          <ConsoleField label={t("defaultModel")} description={t("defaultModelDescription")}>
            <Select
              value={settings.defaultModel}
              onValueChange={(value) =>
                handleWorkspaceUpdate({
                  defaultModel: value as AppSettings["defaultModel"],
                })
              }
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="universal">{tm("universal")}</SelectItem>
                <SelectItem value="claude">{tm("claude")}</SelectItem>
                <SelectItem value="gpt4">{tm("gpt4")}</SelectItem>
                <SelectItem value="gemini">{tm("gemini")}</SelectItem>
                <SelectItem value="deepseek">{tm("deepseek")}</SelectItem>
              </SelectContent>
            </Select>
          </ConsoleField>

          <ConsoleField label={t("defaultStatus")} description={t("defaultStatusDescription")}>
            <Select
              value={settings.defaultStatus}
              onValueChange={(value) =>
                handleWorkspaceUpdate({
                  defaultStatus: value as AppSettings["defaultStatus"],
                })
              }
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbox">{ts("inbox")}</SelectItem>
                <SelectItem value="production">{ts("production")}</SelectItem>
                <SelectItem value="archived">{ts("archived")}</SelectItem>
              </SelectContent>
            </Select>
          </ConsoleField>
        </div>
      </section>

      <section className="app-panel space-y-6 p-6">
        <SectionHeader
          title={t("agentControlsTitle")}
          description={t("agentControlsDescription")}
        />

        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          <SettingsToggleCard
            title={t("enableAgent")}
            description={t("enableAgentDesc")}
            checked={settings.agent.enabled}
            disabled={pending}
            onCheckedChange={(checked) => handleAgentUpdate({ enabled: checked })}
          />
          <SettingsToggleCard
            title={t("autoAnalyze")}
            description={t("autoAnalyzeDesc")}
            checked={settings.agent.autoAnalyze}
            disabled={pending || !settings.agent.enabled}
            onCheckedChange={(checked) => handleAgentUpdate({ autoAnalyze: checked })}
          />
          <SettingsToggleCard
            title={t("analyzeOnPaste")}
            description={t("analyzeOnPasteDesc")}
            checked={settings.agent.analyzeOnPaste}
            disabled={pending || !settings.agent.enabled}
            onCheckedChange={(checked) => handleAgentUpdate({ analyzeOnPaste: checked })}
          />
          <SettingsToggleCard
            title={t("normalization")}
            description={t("normalizationDesc")}
            checked={settings.agent.enableNormalization}
            disabled={pending || !settings.agent.enabled}
            onCheckedChange={(checked) => handleAgentUpdate({ enableNormalization: checked })}
          />
          <SettingsToggleCard
            title={t("moduleExtraction")}
            description={t("moduleExtractionDesc")}
            checked={settings.agent.enableModuleExtraction}
            disabled={pending || !settings.agent.enabled}
            onCheckedChange={(checked) => handleAgentUpdate({ enableModuleExtraction: checked })}
          />
        </div>

        <Separator />

        <div className="grid gap-4 xl:grid-cols-2">
          <ConsoleField label={t("providerLabel")} description={t("providerDescription")}>
            <Select
              value={settings.agent.provider}
              onValueChange={(value) =>
                handleAgentUpdate({
                  provider: value as AppSettings["agent"]["provider"],
                })
              }
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimax">{t("providers.minimax")}</SelectItem>
                <SelectItem value="openai">{t("providers.openai")}</SelectItem>
                <SelectItem value="claude">{t("providers.claude")}</SelectItem>
                <SelectItem value="gemini">{t("providers.gemini")}</SelectItem>
                <SelectItem value="zhipu">{t("providers.zhipu")}</SelectItem>
                <SelectItem value="mock">{t("providers.mock")}</SelectItem>
              </SelectContent>
            </Select>
          </ConsoleField>

          <ConsoleField label={t("analysisDepth")} description={t("analysisDepthDescription")}>
            <Select
              value={settings.agent.analysisDepth}
              onValueChange={(value) =>
                handleAgentUpdate({
                  analysisDepth: value as AppSettings["agent"]["analysisDepth"],
                })
              }
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">{t("quick")}</SelectItem>
                <SelectItem value="standard">{t("standard")}</SelectItem>
                <SelectItem value="deep">{t("deep")}</SelectItem>
              </SelectContent>
            </Select>
          </ConsoleField>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ConsoleField label={t("riskThreshold")} description={t("riskThresholdDescription")}>
            <Select
              value={settings.agent.riskThreshold}
              onValueChange={(value) =>
                handleAgentUpdate({
                  riskThreshold: value as AppSettings["agent"]["riskThreshold"],
                })
              }
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("riskOptions.low")}</SelectItem>
                <SelectItem value="medium">{t("riskOptions.medium")}</SelectItem>
                <SelectItem value="high">{t("riskOptions.high")}</SelectItem>
              </SelectContent>
            </Select>
          </ConsoleField>

          <ConsoleField
            label={t("confidenceThreshold")}
            description={t("confidenceThresholdDescription")}
          >
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={thresholdDraft.confidenceThreshold}
                onChange={(event) =>
                  setThresholdDraft((current) => ({
                    ...current,
                    confidenceThreshold: event.target.value,
                  }))
                }
                onBlur={() => handleThresholdCommit("confidenceThreshold")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    handleThresholdCommit("confidenceThreshold")
                  }
                }}
                className="h-11 rounded-2xl"
              />
              <p className="text-xs text-muted-foreground">{t("thresholdHint")}</p>
            </div>
          </ConsoleField>

          <ConsoleField
            label={t("similarityThreshold")}
            description={t("similarityThresholdDescription")}
          >
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={thresholdDraft.similarityThreshold}
                onChange={(event) =>
                  setThresholdDraft((current) => ({
                    ...current,
                    similarityThreshold: event.target.value,
                  }))
                }
                onBlur={() => handleThresholdCommit("similarityThreshold")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    handleThresholdCommit("similarityThreshold")
                  }
                }}
                className="h-11 rounded-2xl"
              />
              <p className="text-xs text-muted-foreground">{t("thresholdHint")}</p>
            </div>
          </ConsoleField>
        </div>
      </section>

      <section className="app-panel space-y-6 p-6">
        <SectionHeader
          title={t("dataRecoveryTitle")}
          description={t("dataRecoveryDescription")}
        />

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
                <Download className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("exportData")}</div>
                <p className="text-sm leading-6 text-muted-foreground">{t("exportDataDesc")}</p>
              </div>
            </div>
            <Button className="mt-5 w-full rounded-2xl" variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
          </div>

          <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
                <Upload className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("importData")}</div>
                <p className="text-sm leading-6 text-muted-foreground">{t("importDataDesc")}</p>
              </div>
            </div>
            <Button
              className="mt-5 w-full rounded-2xl"
              variant="outline"
              onClick={handleImport}
              disabled={importing || pending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? t("importing") : t("import")}
            </Button>
          </div>

          <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/6 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-destructive/20 bg-background/70 text-destructive">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("resetSettings")}</div>
                <p className="text-sm leading-6 text-muted-foreground">{t("resetSettingsDesc")}</p>
              </div>
            </div>
            <Button
              className="mt-5 w-full rounded-2xl"
              variant="destructive"
              onClick={handleReset}
              disabled={pending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("reset")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <div className="app-panel flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{t("footnotes.defaultsTitle")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("footnotes.defaultsDescription")}</p>
          </div>
        </div>
        <div className="app-panel flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{t("footnotes.agentTitle")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("footnotes.agentDescription")}</p>
          </div>
        </div>
        <div className="app-panel flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{t("footnotes.thresholdsTitle")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("footnotes.thresholdsDescription")}</p>
          </div>
        </div>
        <div className="app-panel flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{t("footnotes.dataTitle")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("footnotes.dataDescription")}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
