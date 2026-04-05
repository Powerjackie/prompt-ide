import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsCoreFeaturesModulesPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-are-modules", text: t("pages.modules.whatIs.title"), level: 2 },
    { id: "module-types", text: t("pages.modules.types.title"), level: 2 },
    { id: "browsing-modules", text: t("pages.modules.browsing.title"), level: 2 },
    { id: "creating-and-editing", text: t("pages.modules.editing.title"), level: 2 },
    { id: "inserting-in-editor", text: t("pages.modules.inserting.title"), level: 2 },
  ]

  const types = ["role", "goal", "constraint", "outputFormat", "style", "selfCheck"] as const

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.modules.title")}</h1>
      <p>{t("pages.modules.intro")}</p>

      <h2 id="what-are-modules">{t("pages.modules.whatIs.title")}</h2>
      <p>{t("pages.modules.whatIs.content")}</p>

      <h2 id="module-types">{t("pages.modules.types.title")}</h2>
      <p>{t("pages.modules.types.content")}</p>
      <ul>
        {types.map((key) => (
          <li key={key}>
            <strong>{t(`pages.modules.types.items.${key}.title`)}</strong>{" "}
            {t(`pages.modules.types.items.${key}.content`)}
          </li>
        ))}
      </ul>

      <h2 id="browsing-modules">{t("pages.modules.browsing.title")}</h2>
      <p>{t("pages.modules.browsing.content")}</p>

      <h2 id="creating-and-editing">{t("pages.modules.editing.title")}</h2>
      <p>{t("pages.modules.editing.content")}</p>
      <ul>
        <li>{t("pages.modules.editing.required")}</li>
        <li>{t("pages.modules.editing.tags")}</li>
        <li>{t("pages.modules.editing.aiGenerated")}</li>
      </ul>

      <h2 id="inserting-in-editor">{t("pages.modules.inserting.title")}</h2>
      <p>{t("pages.modules.inserting.content")}</p>

      <Callout type="note">{t("pages.modules.calloutNote")}</Callout>
    </DocsArticle>
  )
}