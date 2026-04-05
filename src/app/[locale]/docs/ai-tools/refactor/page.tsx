import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsAiToolsRefactorPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-is-agent-refactor", text: t("pages.refactor.whatIs.title"), level: 2 },
    { id: "how-to-run", text: t("pages.refactor.howToRun.title"), level: 2 },
    { id: "proposal", text: t("pages.refactor.proposal.title"), level: 2 },
    { id: "diff-view", text: t("pages.refactor.diff.title"), level: 2 },
    { id: "applying-changes", text: t("pages.refactor.apply.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.refactor.title")}</h1>
      <p>{t("pages.refactor.intro")}</p>

      <h2 id="what-is-agent-refactor">{t("pages.refactor.whatIs.title")}</h2>
      <p>{t("pages.refactor.whatIs.content")}</p>

      <h2 id="how-to-run">{t("pages.refactor.howToRun.title")}</h2>
      <p>{t("pages.refactor.howToRun.content")}</p>

      <h2 id="proposal">{t("pages.refactor.proposal.title")}</h2>
      <p>{t("pages.refactor.proposal.content")}</p>
      <ul>
        <li>{t("pages.refactor.proposal.summary")}</li>
        <li>{t("pages.refactor.proposal.draft")}</li>
        <li>{t("pages.refactor.proposal.variables")}</li>
        <li>{t("pages.refactor.proposal.modules")}</li>
      </ul>

      <h2 id="diff-view">{t("pages.refactor.diff.title")}</h2>
      <p>{t("pages.refactor.diff.content")}</p>

      <h2 id="applying-changes">{t("pages.refactor.apply.title")}</h2>
      <p>{t("pages.refactor.apply.content")}</p>
      <ul>
        <li>{t("pages.refactor.apply.draft")}</li>
        <li>{t("pages.refactor.apply.variables")}</li>
        <li>{t("pages.refactor.apply.modules")}</li>
        <li>{t("pages.refactor.apply.collections")}</li>
      </ul>

      <Callout type="warning">{t("pages.refactor.calloutWarning")}</Callout>
      <Callout type="tip">{t("pages.refactor.calloutTip")}</Callout>
    </DocsArticle>
  )
}