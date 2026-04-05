import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsCoreFeaturesEditorPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "editor-layout", text: t("pages.editor.titlePage.layout"), level: 2 },
    { id: "metadata-form", text: t("pages.editor.titlePage.metadata"), level: 2 },
    { id: "content-editor", text: t("pages.editor.titlePage.content"), level: 2 },
    { id: "tool-panel-tabs", text: t("pages.editor.titlePage.tools"), level: 2 },
    { id: "saving-and-dirty-state", text: t("pages.editor.titlePage.saving"), level: 2 },
  ]

  const models = ["universal", "claude", "gpt4", "gemini", "deepseek"] as const
  const categories = ["code", "writing", "data", "marketing", "education", "design", "research", "productivity", "communication", "general"] as const

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.editor.title")}</h1>
      <p>{t("pages.editor.intro")}</p>

      <h2 id="editor-layout">{t("pages.editor.titlePage.layout")}</h2>
      <p>{t("pages.editor.layout.content")}</p>

      <h2 id="metadata-form">{t("pages.editor.titlePage.metadata")}</h2>
      <p>{t("pages.editor.metadata.content")}</p>
      <ul>
        <li>{t("pages.editor.metadata.required")}</li>
        <li>{t("pages.editor.metadata.optional")}</li>
        <li>
          <strong>{t("pages.editor.metadata.modelsTitle")}</strong>
          <ul>
            {models.map((model) => (
              <li key={model}>{t(`models.${model}`)}</li>
            ))}
          </ul>
        </li>
        <li>
          <strong>{t("pages.editor.metadata.categoriesTitle")}</strong>
          <ul>
            {categories.map((category) => (
              <li key={category}>{t(`categories.${category}`)}</li>
            ))}
          </ul>
        </li>
      </ul>

      <h2 id="content-editor">{t("pages.editor.titlePage.content")}</h2>
      <p>{t("pages.editor.content.content")}</p>

      <h2 id="tool-panel-tabs">{t("pages.editor.titlePage.tools")}</h2>
      <p>{t("pages.editor.tools.content")}</p>
      <ul>
        <li>{t("pages.editor.tools.preview")}</li>
        <li>{t("pages.editor.tools.agent")}</li>
        <li>{t("pages.editor.tools.versions")}</li>
        <li>{t("pages.editor.tools.modules")}</li>
      </ul>

      <h2 id="saving-and-dirty-state">{t("pages.editor.titlePage.saving")}</h2>
      <p>{t("pages.editor.saving.content")}</p>
      <ul>
        <li>{t("pages.editor.saving.create")}</li>
        <li>{t("pages.editor.saving.update")}</li>
        <li>{t("pages.editor.saving.dirty")}</li>
      </ul>

      <Callout type="warning">{t("pages.editor.calloutWarning")}</Callout>
      <Callout type="tip">{t("pages.editor.calloutTip")}</Callout>
    </DocsArticle>
  )
}