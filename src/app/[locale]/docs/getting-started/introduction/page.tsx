import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsGettingStartedIntroductionPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-is-prompt-ide", text: t("pages.introduction.whatIs.title"), level: 2 },
    { id: "core-capabilities", text: t("pages.introduction.capabilities.title"), level: 2 },
    { id: "who-is-it-for", text: t("pages.introduction.audience.title"), level: 2 },
    { id: "tech-foundation", text: t("pages.introduction.foundation.title"), level: 2 },
  ]

  const capabilities = ["prompts", "editor", "analysis", "benchmark", "modules", "skills"] as const

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.introduction.title")}</h1>
      <p>{t("pages.introduction.intro")}</p>

      <h2 id="what-is-prompt-ide">{t("pages.introduction.whatIs.title")}</h2>
      <p>{t("pages.introduction.whatIs.content")}</p>

      <h2 id="core-capabilities">{t("pages.introduction.capabilities.title")}</h2>
      <p>{t("pages.introduction.capabilities.content")}</p>
      <ul>
        {capabilities.map((key) => (
          <li key={key}>
            <strong>{t(`pages.introduction.capabilities.items.${key}.title`)}</strong>{" "}
            {t(`pages.introduction.capabilities.items.${key}.content`)}
          </li>
        ))}
      </ul>

      <h2 id="who-is-it-for">{t("pages.introduction.audience.title")}</h2>
      <p>{t("pages.introduction.audience.content")}</p>

      <h2 id="tech-foundation">{t("pages.introduction.foundation.title")}</h2>
      <p>{t("pages.introduction.foundation.content")}</p>

      <Callout type="tip">{t("pages.introduction.calloutTip")}</Callout>
    </DocsArticle>
  )
}