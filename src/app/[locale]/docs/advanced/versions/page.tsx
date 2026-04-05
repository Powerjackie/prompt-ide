import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsAdvancedVersionsPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-is-version-history", text: t("pages.versions.whatIs.title"), level: 2 },
    { id: "snapshots", text: t("pages.versions.snapshots.title"), level: 2 },
    { id: "viewing-versions", text: t("pages.versions.viewing.title"), level: 2 },
    { id: "baseline", text: t("pages.versions.baseline.title"), level: 2 },
    { id: "restoring-a-version", text: t("pages.versions.restore.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.versions.title")}</h1>
      <p>{t("pages.versions.intro")}</p>

      <h2 id="what-is-version-history">{t("pages.versions.whatIs.title")}</h2>
      <p>{t("pages.versions.whatIs.content")}</p>

      <h2 id="snapshots">{t("pages.versions.snapshots.title")}</h2>
      <p>{t("pages.versions.snapshots.content")}</p>

      <h2 id="viewing-versions">{t("pages.versions.viewing.title")}</h2>
      <p>{t("pages.versions.viewing.content")}</p>

      <h2 id="baseline">{t("pages.versions.baseline.title")}</h2>
      <p>{t("pages.versions.baseline.content")}</p>

      <h2 id="restoring-a-version">{t("pages.versions.restore.title")}</h2>
      <p>{t("pages.versions.restore.content")}</p>

      <Callout type="note">{t("pages.versions.calloutNote")}</Callout>
    </DocsArticle>
  )
}