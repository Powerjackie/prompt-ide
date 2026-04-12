import { EditorLayout } from "@/components/editor/editor-layout"
import { getDefaultSettings, getEffectiveSettings } from "@/lib/settings/effective-settings"

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getEffectiveSettings()
  const settings = result.success ? result.data : getDefaultSettings()

  return (
    <EditorLayout
      promptId={id}
      defaultModel={settings.defaultModel}
      defaultStatus={settings.defaultStatus}
      agentEnabled={settings.agent.enabled}
    />
  )
}
