"use client"

import { useState, useTransition, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Settings as SettingsIcon, Download, Upload, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getSettings,
  updateSettings,
  updateAgentSettings,
  resetSettings,
} from "@/app/actions/settings.actions"
import { getPrompts, createPrompt } from "@/app/actions/prompt.actions"
import { getModules } from "@/app/actions/module.actions"
import type { AppSettings } from "@/types/settings"
import type { SerializedPrompt } from "@/app/actions/prompt.actions"
import type { SerializedModule } from "@/app/actions/module.actions"
import { toast } from "sonner"

export default function SettingsPage() {
  const t = useTranslations("settings")
  const tm = useTranslations("models")
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [modules, setModules] = useState<SerializedModule[]>([])
  const [importing, setImporting] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getSettings().then((result) => {
      if (result.success) setSettings(result.data)
    })
    getPrompts().then((result) => {
      if (result.success) setPrompts(result.data)
    })
    getModules().then((result) => {
      if (result.success) setModules(result.data)
    })
  }, [])

  const handleUpdateSettings = (data: Partial<AppSettings>) => {
    startTransition(async () => {
      const result = await updateSettings(data)
      if (result.success) {
        setSettings(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleUpdateAgentSettings = (data: Partial<AppSettings["agent"]>) => {
    startTransition(async () => {
      const result = await updateAgentSettings(data)
      if (result.success) {
        setSettings(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetSettings()
      if (result.success) {
        setSettings(result.data)
        toast.success(t("resetDone"))
      } else {
        toast.error(result.error)
      }
    })
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
    const a = document.createElement("a")
    a.href = url
    a.download = `prompt-ide-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t("exported"))
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setImporting(true)
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!data.prompts || !Array.isArray(data.prompts)) {
          toast.error(t("invalidFile"))
          return
        }
        let imported = 0
        for (const p of data.prompts) {
          const result = await createPrompt({
            title: p.title,
            content: p.content,
            description: p.description ?? "",
            status: p.status ?? "inbox",
            source: p.source ?? "",
            model: p.model ?? "universal",
            category: p.category ?? "general",
            tags: p.tags ?? [],
            notes: p.notes ?? "",
            variables: p.variables ?? [],
            isFavorite: p.isFavorite ?? false,
          })
          if (result.success) imported++
        }
        toast.success(t("importSuccess") + ` (${imported})`)
        const refreshed = await getPrompts()
        if (refreshed.success) setPrompts(refreshed.data)
      } catch {
        toast.error(t("importError"))
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={pending ? "max-w-2xl space-y-6 opacity-70 pointer-events-none" : "max-w-2xl space-y-6"}>
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {/* Defaults */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t("defaults")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("defaultView")}</Label>
            <Select
              value={settings.defaultView}
              onValueChange={(v) => v && handleUpdateSettings({ defaultView: v as "card" | "list" })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">{t("card")}</SelectItem>
                <SelectItem value="list">{t("list")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>{t("defaultModel")}</Label>
            <Select
              value={settings.defaultModel}
              onValueChange={(v) => v && handleUpdateSettings({ defaultModel: v })}
            >
              <SelectTrigger className="w-28">
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
          </div>
        </CardContent>
      </Card>

      {/* Agent Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t("agentSection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("enableAgent")}</Label>
              <p className="text-xs text-muted-foreground">{t("enableAgentDesc")}</p>
            </div>
            <Switch
              checked={settings.agent.enabled}
              onCheckedChange={(v) => handleUpdateAgentSettings({ enabled: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("autoAnalyze")}</Label>
              <p className="text-xs text-muted-foreground">{t("autoAnalyzeDesc")}</p>
            </div>
            <Switch
              checked={settings.agent.autoAnalyze}
              onCheckedChange={(v) => handleUpdateAgentSettings({ autoAnalyze: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("normalization")}</Label>
              <p className="text-xs text-muted-foreground">{t("normalizationDesc")}</p>
            </div>
            <Switch
              checked={settings.agent.enableNormalization}
              onCheckedChange={(v) => handleUpdateAgentSettings({ enableNormalization: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("moduleExtraction")}</Label>
              <p className="text-xs text-muted-foreground">{t("moduleExtractionDesc")}</p>
            </div>
            <Switch
              checked={settings.agent.enableModuleExtraction}
              onCheckedChange={(v) => handleUpdateAgentSettings({ enableModuleExtraction: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>{t("analysisDepth")}</Label>
            <Select
              value={settings.agent.analysisDepth}
              onValueChange={(v) => v && handleUpdateAgentSettings({ analysisDepth: v as "quick" | "standard" | "deep" })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">{t("quick")}</SelectItem>
                <SelectItem value="standard">{t("standard")}</SelectItem>
                <SelectItem value="deep">{t("deep")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t("dataSection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("exportData")}</Label>
              <p className="text-xs text-muted-foreground">{t("exportDataDesc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> {t("export")}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("importData")}</Label>
              <p className="text-xs text-muted-foreground">{t("importDataDesc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleImport} disabled={importing || pending}>
              <Upload className="h-4 w-4 mr-1" /> {t("import")}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("resetSettings")}</Label>
              <p className="text-xs text-muted-foreground">{t("resetSettingsDesc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={pending}>
              <RotateCcw className="h-4 w-4 mr-1" /> {t("reset")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
