import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsCoreFeaturesPromptsPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-is-a-prompt", text: t("pages.prompts.whatIs.title"), level: 2 },
    { id: "prompt-statuses", text: t("pages.prompts.statuses.title"), level: 2 },
    { id: "browsing-prompts", text: t("pages.prompts.browsing.title"), level: 2 },
    { id: "prompt-detail-page", text: t("pages.prompts.detail.title"), level: 2 },
    { id: "common-actions", text: t("pages.prompts.actions.title"), level: 2 },
  ]

  const statuses = ["inbox", "production", "archived"] as const
  const actions = ["copy", "favorite", "edit", "promote", "clone", "createSkill", "archiveRestore", "delete"] as const

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.prompts.title")}</h1>
      <p>{t("pages.prompts.intro")}</p>

      <h2 id="what-is-a-prompt">{t("pages.prompts.whatIs.title")}</h2>
      <p>{t("pages.prompts.whatIs.content")}</p>

      <h2 id="prompt-statuses">{t("pages.prompts.statuses.title")}</h2>
      <p>{t("pages.prompts.statuses.content")}</p>
      <ul>
        {statuses.map((key) => (
          <li key={key}>
            <strong>{t(`pages.prompts.statuses.items.${key}.title`)}</strong>{" "}
            {t(`pages.prompts.statuses.items.${key}.content`)}
          </li>
        ))}
      </ul>

      <h2 id="browsing-prompts">{t("pages.prompts.browsing.title")}</h2>
      <p>{t("pages.prompts.browsing.content")}</p>
      <ul>
        <li>{t("pages.prompts.browsing.views")}</li>
        <li>{t("pages.prompts.browsing.filters")}</li>
        <li>{t("pages.prompts.browsing.sorting")}</li>
        <li>{t("pages.prompts.browsing.search")}</li>
      </ul>

      <h2 id="prompt-detail-page">{t("pages.prompts.detail.title")}</h2>
      <p>{t("pages.prompts.detail.content")}</p>
      <ul>
        <li>{t("pages.prompts.detail.fullContent")}</li>
        <li>{t("pages.prompts.detail.variables")}</li>
        <li>{t("pages.prompts.detail.notes")}</li>
        <li>{t("pages.prompts.detail.metadata")}</li>
        <li>{t("pages.prompts.detail.tags")}</li>
      </ul>

      <h2 id="common-actions">{t("pages.prompts.actions.title")}</h2>
      <p>{t("pages.prompts.actions.content")}</p>
      <ul>
        {actions.map((key) => (
          <li key={key}>{t(`pages.prompts.actions.items.${key}`)}</li>
        ))}
      </ul>

      <Callout type="note">{t("pages.prompts.calloutNote")}</Callout>
    </DocsArticle>
  )
}