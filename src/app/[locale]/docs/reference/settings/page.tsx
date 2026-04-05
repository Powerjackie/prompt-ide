import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsReferenceSettingsPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "accessing-settings", text: t("pages.settings.access.title"), level: 2 },
    { id: "workspace-defaults", text: t("pages.settings.workspace.title"), level: 2 },
    { id: "agent-controls", text: t("pages.settings.agent.title"), level: 2 },
    { id: "data-management", text: t("pages.settings.data.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.settings.title")}</h1>
      <p>{t("pages.settings.intro")}</p>

      <h2 id="accessing-settings">{t("pages.settings.access.title")}</h2>
      <p>{t("pages.settings.access.content")}</p>

      <h2 id="workspace-defaults">{t("pages.settings.workspace.title")}</h2>
      <p>{t("pages.settings.workspace.content")}</p>
      <ul>
        <li>{t("pages.settings.workspace.theme")}</li>
        <li>{t("pages.settings.workspace.defaultView")}</li>
        <li>{t("pages.settings.workspace.defaultModel")}</li>
        <li>{t("pages.settings.workspace.defaultStatus")}</li>
      </ul>

      <h2 id="agent-controls">{t("pages.settings.agent.title")}</h2>
      <p>{t("pages.settings.agent.content")}</p>
      <ul>
        <li>{t("pages.settings.agent.enabled")}</li>
        <li>{t("pages.settings.agent.autoAnalyze")}</li>
        <li>{t("pages.settings.agent.analyzeOnPaste")}</li>
        <li>{t("pages.settings.agent.normalization")}</li>
        <li>{t("pages.settings.agent.moduleExtraction")}</li>
        <li>{t("pages.settings.agent.analysisDepth")}</li>
        <li>{t("pages.settings.agent.thresholds")}</li>
      </ul>

      <h2 id="data-management">{t("pages.settings.data.title")}</h2>
      <p>{t("pages.settings.data.content")}</p>
      <ul>
        <li>{t("pages.settings.data.export")}</li>
        <li>{t("pages.settings.data.import")}</li>
        <li>{t("pages.settings.data.reset")}</li>
      </ul>

      <Callout type="warning">{t("pages.settings.calloutWarning")}</Callout>
    </DocsArticle>
  )
}