import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsCoreFeaturesCollectionsPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-are-collections", text: t("pages.collections.whatIs.title"), level: 2 },
    { id: "collection-types", text: t("pages.collections.types.title"), level: 2 },
    { id: "creating-a-collection", text: t("pages.collections.create.title"), level: 2 },
    { id: "adding-items", text: t("pages.collections.adding.title"), level: 2 },
    { id: "collection-detail", text: t("pages.collections.detail.title"), level: 2 },
  ]

  const types = ["workflow", "toolkit", "learning"] as const

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.collections.title")}</h1>
      <p>{t("pages.collections.intro")}</p>

      <h2 id="what-are-collections">{t("pages.collections.whatIs.title")}</h2>
      <p>{t("pages.collections.whatIs.content")}</p>

      <h2 id="collection-types">{t("pages.collections.types.title")}</h2>
      <p>{t("pages.collections.types.content")}</p>
      <ul>
        {types.map((key) => (
          <li key={key}>
            <strong>{t(`pages.collections.types.items.${key}.title`)}</strong>{" "}
            {t(`pages.collections.types.items.${key}.content`)}
          </li>
        ))}
      </ul>

      <h2 id="creating-a-collection">{t("pages.collections.create.title")}</h2>
      <p>{t("pages.collections.create.content")}</p>

      <h2 id="adding-items">{t("pages.collections.adding.title")}</h2>
      <p>{t("pages.collections.adding.content")}</p>
      <ul>
        <li>{t("pages.collections.adding.prompts")}</li>
        <li>{t("pages.collections.adding.modules")}</li>
        <li>{t("pages.collections.adding.noDuplicates")}</li>
      </ul>

      <h2 id="collection-detail">{t("pages.collections.detail.title")}</h2>
      <p>{t("pages.collections.detail.content")}</p>

      <Callout type="tip">{t("pages.collections.calloutTip")}</Callout>
    </DocsArticle>
  )
}