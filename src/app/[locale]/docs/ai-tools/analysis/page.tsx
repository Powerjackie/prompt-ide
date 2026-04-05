import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsAiToolsAnalysisPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-is-agent-analysis", text: t("pages.analysis.whatIs.title"), level: 2 },
    { id: "how-to-run", text: t("pages.analysis.howToRun.title"), level: 2 },
    { id: "analysis-results", text: t("pages.analysis.results.title"), level: 2 },
    { id: "agent-trajectory", text: t("pages.analysis.trajectory.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.analysis.title")}</h1>
      <p>{t("pages.analysis.intro")}</p>

      <h2 id="what-is-agent-analysis">{t("pages.analysis.whatIs.title")}</h2>
      <p>{t("pages.analysis.whatIs.content")}</p>

      <h2 id="how-to-run">{t("pages.analysis.howToRun.title")}</h2>
      <p>{t("pages.analysis.howToRun.content")}</p>

      <h2 id="analysis-results">{t("pages.analysis.results.title")}</h2>
      <p>{t("pages.analysis.results.content")}</p>
      <ul>
        <li>{t("pages.analysis.results.confidence")}</li>
        <li>{t("pages.analysis.results.risk")}</li>
        <li>{t("pages.analysis.results.category")}</li>
        <li>{t("pages.analysis.results.variables")}</li>
        <li>{t("pages.analysis.results.similar")}</li>
        <li>{t("pages.analysis.results.modules")}</li>
      </ul>

      <h2 id="agent-trajectory">{t("pages.analysis.trajectory.title")}</h2>
      <p>{t("pages.analysis.trajectory.content")}</p>

      <Callout type="note">{t("pages.analysis.calloutNote")}</Callout>
    </DocsArticle>
  )
}