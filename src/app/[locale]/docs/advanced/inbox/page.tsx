import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsAdvancedInboxPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-is-the-inbox", text: t("pages.inbox.whatIs.title"), level: 2 },
    { id: "how-items-enter", text: t("pages.inbox.enter.title"), level: 2 },
    { id: "quick-capture", text: t("pages.inbox.capture.title"), level: 2 },
    { id: "managing-items", text: t("pages.inbox.manage.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.inbox.title")}</h1>
      <p>{t("pages.inbox.intro")}</p>

      <h2 id="what-is-the-inbox">{t("pages.inbox.whatIs.title")}</h2>
      <p>{t("pages.inbox.whatIs.content")}</p>

      <h2 id="how-items-enter">{t("pages.inbox.enter.title")}</h2>
      <p>{t("pages.inbox.enter.content")}</p>
      <ul>
        <li>{t("pages.inbox.enter.newPrompt")}</li>
        <li>{t("pages.inbox.enter.quickCapture")}</li>
        <li>{t("pages.inbox.enter.clone")}</li>
      </ul>

      <h2 id="quick-capture">{t("pages.inbox.capture.title")}</h2>
      <p>{t("pages.inbox.capture.content")}</p>

      <h2 id="managing-items">{t("pages.inbox.manage.title")}</h2>
      <p>{t("pages.inbox.manage.content")}</p>
      <ul>
        <li>{t("pages.inbox.manage.promote")}</li>
        <li>{t("pages.inbox.manage.edit")}</li>
        <li>{t("pages.inbox.manage.archive")}</li>
        <li>{t("pages.inbox.manage.copy")}</li>
      </ul>

      <Callout type="tip">{t("pages.inbox.calloutTip")}</Callout>
    </DocsArticle>
  )
}