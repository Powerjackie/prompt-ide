import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsCoreFeaturesVariablesPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-are-variables", text: t("pages.variables.whatIs.title"), level: 2 },
    { id: "syntax", text: t("pages.variables.syntax.title"), level: 2 },
    { id: "automatic-detection", text: t("pages.variables.detection.title"), level: 2 },
    { id: "preview-rendering", text: t("pages.variables.preview.title"), level: 2 },
    { id: "example", text: t("pages.variables.example.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.variables.title")}</h1>
      <p>{t("pages.variables.intro")}</p>

      <h2 id="what-are-variables">{t("pages.variables.whatIs.title")}</h2>
      <p>{t("pages.variables.whatIs.content")}</p>

      <h2 id="syntax">{t("pages.variables.syntax.title")}</h2>
      <p>{t("pages.variables.syntax.content")}</p>

      <h2 id="automatic-detection">{t("pages.variables.detection.title")}</h2>
      <p>{t("pages.variables.detection.content")}</p>
      <ul>
        <li>{t("pages.variables.detection.name")}</li>
        <li>{t("pages.variables.detection.description")}</li>
        <li>{t("pages.variables.detection.defaultValue")}</li>
      </ul>

      <h2 id="preview-rendering">{t("pages.variables.preview.title")}</h2>
      <p>{t("pages.variables.preview.content")}</p>
      <ul>
        <li>{t("pages.variables.preview.withDefault")}</li>
        <li>{t("pages.variables.preview.withoutDefault")}</li>
      </ul>

      <h2 id="example">{t("pages.variables.example.title")}</h2>
      <p>{t("pages.variables.example.content")}</p>
      <pre>
        <code>{t("pages.variables.example.code")}</code>
      </pre>

      <Callout type="tip">{t("pages.variables.calloutTip")}</Callout>
    </DocsArticle>
  )
}