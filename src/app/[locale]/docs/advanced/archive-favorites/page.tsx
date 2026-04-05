import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsAdvancedArchiveFavoritesPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "archive", text: t("pages.archiveFavorites.archive.title"), level: 2 },
    { id: "favorites", text: t("pages.archiveFavorites.favorites.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.archiveFavorites.title")}</h1>
      <p>{t("pages.archiveFavorites.intro")}</p>

      <h2 id="archive">{t("pages.archiveFavorites.archive.title")}</h2>
      <p>{t("pages.archiveFavorites.archive.content")}</p>
      <ul>
        <li>{t("pages.archiveFavorites.archive.softDelete")}</li>
        <li>{t("pages.archiveFavorites.archive.restore")}</li>
        <li>{t("pages.archiveFavorites.archive.deleteForever")}</li>
      </ul>

      <h2 id="favorites">{t("pages.archiveFavorites.favorites.title")}</h2>
      <p>{t("pages.archiveFavorites.favorites.content")}</p>
      <ul>
        <li>{t("pages.archiveFavorites.favorites.orthogonal")}</li>
        <li>{t("pages.archiveFavorites.favorites.add")}</li>
        <li>{t("pages.archiveFavorites.favorites.remove")}</li>
        <li>{t("pages.archiveFavorites.favorites.visible")}</li>
      </ul>

      <Callout type="note">{t("pages.archiveFavorites.calloutNote")}</Callout>
    </DocsArticle>
  )
}