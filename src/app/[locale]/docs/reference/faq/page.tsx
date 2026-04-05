import { getTranslations } from "next-intl/server"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsReferenceFaqPage() {
  const t = await getTranslations("docs")
  const questions = [
    "grayButton",
    "serviceUnavailable",
    "promoteInbox",
    "deletePermission",
    "backupData",
    "variableSyntax",
    "modulesVsPrompts",
    "restoreVersions",
  ] as const

  const headings: DocsHeading[] = questions.map((key) => ({
    id: `faq-${key}`,
    text: t(`pages.faq.questions.${key}.title`),
    level: 2,
  }))

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.faq.title")}</h1>
      <p>{t("pages.faq.intro")}</p>

      {questions.map((key) => (
        <section key={key}>
          <h2 id={`faq-${key}`}>{t(`pages.faq.questions.${key}.title`)}</h2>
          <p>{t(`pages.faq.questions.${key}.answer1`)}</p>
          <p>{t(`pages.faq.questions.${key}.answer2`)}</p>
        </section>
      ))}
    </DocsArticle>
  )
}