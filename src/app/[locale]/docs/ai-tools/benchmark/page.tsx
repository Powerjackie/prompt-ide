import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsAiToolsBenchmarkPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-are-benchmarks", text: t("pages.benchmark.whatIs.title"), level: 2 },
    { id: "five-scores", text: t("pages.benchmark.scores.title"), level: 2 },
    { id: "running-a-benchmark", text: t("pages.benchmark.run.title"), level: 2 },
    { id: "evolution-comparison", text: t("pages.benchmark.evolution.title"), level: 2 },
    { id: "comparison-strategies", text: t("pages.benchmark.strategies.title"), level: 2 },
  ]

  const scores = ["overall", "clarity", "reusability", "controllability", "deploymentReadiness"] as const
  const strategies = ["baseline", "previousVersion", "auto"] as const

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.benchmark.title")}</h1>
      <p>{t("pages.benchmark.intro")}</p>

      <h2 id="what-are-benchmarks">{t("pages.benchmark.whatIs.title")}</h2>
      <p>{t("pages.benchmark.whatIs.content")}</p>

      <h2 id="five-scores">{t("pages.benchmark.scores.title")}</h2>
      <p>{t("pages.benchmark.scores.content")}</p>
      <ul>
        {scores.map((key) => (
          <li key={key}>
            <strong>{t(`pages.benchmark.scores.items.${key}.title`)}</strong>{" "}
            {t(`pages.benchmark.scores.items.${key}.content`)}
          </li>
        ))}
      </ul>

      <h2 id="running-a-benchmark">{t("pages.benchmark.run.title")}</h2>
      <p>{t("pages.benchmark.run.content")}</p>

      <h2 id="evolution-comparison">{t("pages.benchmark.evolution.title")}</h2>
      <p>{t("pages.benchmark.evolution.content")}</p>

      <h2 id="comparison-strategies">{t("pages.benchmark.strategies.title")}</h2>
      <p>{t("pages.benchmark.strategies.content")}</p>
      <ul>
        {strategies.map((key) => (
          <li key={key}>{t(`pages.benchmark.strategies.items.${key}`)}</li>
        ))}
      </ul>

      <Callout type="tip">{t("pages.benchmark.calloutTip")}</Callout>
    </DocsArticle>
  )
}