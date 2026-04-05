import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsGettingStartedQuickTourPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "app-layout", text: t("pages.quickTour.layout.title"), level: 2 },
    { id: "sidebar-navigation", text: t("pages.quickTour.sidebar.title"), level: 2 },
    { id: "top-bar-features", text: t("pages.quickTour.topBar.title"), level: 2 },
    { id: "home-dashboard", text: t("pages.quickTour.dashboard.title"), level: 2 },
  ]

  const primaryItems = [
    "home",
    "prompts",
    "editor",
    "inbox",
    "modules",
    "collections",
    "skills",
    "favorites",
    "archive",
    "tags",
  ] as const

  const utilityItems = ["playground", "docs", "settings"] as const

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.quickTour.title")}</h1>
      <p>{t("pages.quickTour.intro")}</p>

      <h2 id="app-layout">{t("pages.quickTour.layout.title")}</h2>
      <p>{t("pages.quickTour.layout.content")}</p>

      <h2 id="sidebar-navigation">{t("pages.quickTour.sidebar.title")}</h2>
      <p>{t("pages.quickTour.sidebar.content")}</p>
      <ul>
        {primaryItems.map((key) => (
          <li key={key}>
            <strong>{t(`pages.quickTour.sidebar.items.${key}.title`)}</strong>{" "}
            {t(`pages.quickTour.sidebar.items.${key}.content`)}
          </li>
        ))}
      </ul>
      <p>{t("pages.quickTour.sidebar.utilityTitle")}</p>
      <ul>
        {utilityItems.map((key) => (
          <li key={key}>
            <strong>{t(`pages.quickTour.sidebar.utilityItems.${key}.title`)}</strong>{" "}
            {t(`pages.quickTour.sidebar.utilityItems.${key}.content`)}
          </li>
        ))}
      </ul>

      <h2 id="top-bar-features">{t("pages.quickTour.topBar.title")}</h2>
      <p>{t("pages.quickTour.topBar.content")}</p>
      <ul>
        <li>{t("pages.quickTour.topBar.search")}</li>
        <li>{t("pages.quickTour.topBar.theme")}</li>
        <li>{t("pages.quickTour.topBar.locale")}</li>
      </ul>

      <h2 id="home-dashboard">{t("pages.quickTour.dashboard.title")}</h2>
      <p>{t("pages.quickTour.dashboard.content")}</p>

      <Callout type="tip">{t("pages.quickTour.calloutTip")}</Callout>
    </DocsArticle>
  )
}