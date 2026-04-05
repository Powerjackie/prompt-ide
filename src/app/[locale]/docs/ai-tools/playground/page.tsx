import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsAiToolsPlaygroundPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-is-the-playground", text: t("pages.playground.whatIs.title"), level: 2 },
    { id: "how-to-use-it", text: t("pages.playground.howToUse.title"), level: 2 },
    { id: "playground-vs-editor", text: t("pages.playground.comparison.title"), level: 2 },
    { id: "analysis-output", text: t("pages.playground.output.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.playground.title")}</h1>
      <p>{t("pages.playground.intro")}</p>

      <h2 id="what-is-the-playground">{t("pages.playground.whatIs.title")}</h2>
      <p>{t("pages.playground.whatIs.content")}</p>

      <h2 id="how-to-use-it">{t("pages.playground.howToUse.title")}</h2>
      <p>{t("pages.playground.howToUse.content")}</p>
      <ol>
        <li>{t("pages.playground.howToUse.step1")}</li>
        <li>{t("pages.playground.howToUse.step2")}</li>
        <li>{t("pages.playground.howToUse.step3")}</li>
        <li>{t("pages.playground.howToUse.step4")}</li>
      </ol>

      <h2 id="playground-vs-editor">{t("pages.playground.comparison.title")}</h2>
      <p>{t("pages.playground.comparison.content")}</p>
      <ul>
        <li>{t("pages.playground.comparison.playground")}</li>
        <li>{t("pages.playground.comparison.editor")}</li>
      </ul>

      <h2 id="analysis-output">{t("pages.playground.output.title")}</h2>
      <p>{t("pages.playground.output.content")}</p>
      <ul>
        <li>{t("pages.playground.output.category")}</li>
        <li>{t("pages.playground.output.variables")}</li>
        <li>{t("pages.playground.output.risk")}</li>
        <li>{t("pages.playground.output.similar")}</li>
      </ul>

      <Callout type="tip">{t("pages.playground.calloutTip")}</Callout>
    </DocsArticle>
  )
}