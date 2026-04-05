import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsReferenceKeyboardShortcutsPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "global-shortcuts", text: t("pages.keyboardShortcuts.global.title"), level: 2 },
    { id: "editor-shortcuts", text: t("pages.keyboardShortcuts.editor.title"), level: 2 },
    { id: "general-interactions", text: t("pages.keyboardShortcuts.general.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.keyboardShortcuts.title")}</h1>
      <p>{t("pages.keyboardShortcuts.intro")}</p>

      <h2 id="global-shortcuts">{t("pages.keyboardShortcuts.global.title")}</h2>
      <ul>
        <li>{t("pages.keyboardShortcuts.global.search")}</li>
      </ul>

      <h2 id="editor-shortcuts">{t("pages.keyboardShortcuts.editor.title")}</h2>
      <ul>
        <li>{t("pages.keyboardShortcuts.editor.save")}</li>
      </ul>

      <h2 id="general-interactions">{t("pages.keyboardShortcuts.general.title")}</h2>
      <p>{t("pages.keyboardShortcuts.general.content")}</p>

      <Callout type="note">{t("pages.keyboardShortcuts.calloutNote")}</Callout>
    </DocsArticle>
  )
}