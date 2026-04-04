import { getTranslations } from "next-intl/server"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

interface DocsPlaceholderPageProps {
  titleKey: string
}

export async function DocsPlaceholderPage({ titleKey }: DocsPlaceholderPageProps) {
  const t = await getTranslations("docs")
  const title = t(titleKey)
  const headings: DocsHeading[] = [
    { id: "overview", text: t("placeholder.sections.overview"), level: 2 },
    { id: "coming-next", text: t("placeholder.sections.comingNext"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{title}</h1>
      <p>{t("placeholder.description", { section: title })}</p>

      <h2 id="overview">{t("placeholder.sections.overview")}</h2>
      <p>{t("placeholder.overview", { section: title })}</p>

      <h2 id="coming-next">{t("placeholder.sections.comingNext")}</h2>
      <p>{t("placeholder.comingNext", { section: title })}</p>
    </DocsArticle>
  )
}
