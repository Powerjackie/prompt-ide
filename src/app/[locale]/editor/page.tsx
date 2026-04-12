import type { Metadata } from "next"
import { EditorLayout } from "@/components/editor/editor-layout"
import { getDefaultSettings, getEffectiveSettings } from "@/lib/settings/effective-settings"

export const metadata: Metadata = { title: "Editor | Prompt IDE" }

export default async function EditorPage() {
  const result = await getEffectiveSettings()
  const settings = result.success ? result.data : getDefaultSettings()

  return (
    <EditorLayout
      defaultModel={settings.defaultModel}
      defaultStatus={settings.defaultStatus}
      agentEnabled={settings.agent.enabled}
    />
  )
}
