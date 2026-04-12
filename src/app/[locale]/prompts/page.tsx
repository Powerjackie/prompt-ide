import type { Metadata } from "next"
import { getDefaultSettings, getEffectiveSettings } from "@/lib/settings/effective-settings"
import { PromptsClient } from "./prompts-client"

export const metadata: Metadata = { title: "Prompts | Prompt IDE" }

export default async function PromptsPage() {
  const result = await getEffectiveSettings()
  const settings = result.success ? result.data : getDefaultSettings()

  return <PromptsClient initialView={settings.defaultView} />
}
