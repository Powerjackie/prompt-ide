import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsCoreFeaturesTagsPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-are-tags", text: t("pages.tags.whatIs.title"), level: 2 },
    { id: "creating-tags", text: t("pages.tags.create.title"), level: 2 },
    { id: "tags-overview", text: t("pages.tags.overview.title"), level: 2 },
    { id: "tag-filtering", text: t("pages.tags.filtering.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.tags.title")}</h1>
      <p>{t("pages.tags.intro")}</p>

      <h2 id="what-are-tags">{t("pages.tags.whatIs.title")}</h2>
      <p>{t("pages.tags.whatIs.content")}</p>

      <h2 id="creating-tags">{t("pages.tags.create.title")}</h2>
      <p>{t("pages.tags.create.content")}</p>
      <ul>
        <li>{t("pages.tags.create.inline")}</li>
        <li>{t("pages.tags.create.confirm")}</li>
        <li>{t("pages.tags.create.lowercase")}</li>
      </ul>

      <h2 id="tags-overview">{t("pages.tags.overview.title")}</h2>
      <p>{t("pages.tags.overview.content")}</p>

      <h2 id="tag-filtering">{t("pages.tags.filtering.title")}</h2>
      <p>{t("pages.tags.filtering.content")}</p>

      <Callout type="note">{t("pages.tags.calloutNote")}</Callout>
    </DocsArticle>
  )
}