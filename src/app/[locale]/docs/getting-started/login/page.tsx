import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsGettingStartedLoginPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "logging-in", text: t("pages.loginRoles.loggingIn.title"), level: 2 },
    { id: "roles", text: t("pages.loginRoles.roles.title"), level: 2 },
    { id: "error-messages", text: t("pages.loginRoles.errors.title"), level: 2 },
    { id: "session", text: t("pages.loginRoles.session.title"), level: 2 },
    { id: "security", text: t("pages.loginRoles.security.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.loginRoles.title")}</h1>
      <p>{t("pages.loginRoles.intro")}</p>

      <h2 id="logging-in">{t("pages.loginRoles.loggingIn.title")}</h2>
      <p>{t("pages.loginRoles.loggingIn.content")}</p>

      <h2 id="roles">{t("pages.loginRoles.roles.title")}</h2>
      <p>{t("pages.loginRoles.roles.content")}</p>
      <ul>
        <li>
          <strong>{t("pages.loginRoles.roles.adminTitle")}</strong>{" "}
          {t("pages.loginRoles.roles.adminContent")}
        </li>
        <li>
          <strong>{t("pages.loginRoles.roles.memberTitle")}</strong>{" "}
          {t("pages.loginRoles.roles.memberContent")}
        </li>
      </ul>

      <h2 id="error-messages">{t("pages.loginRoles.errors.title")}</h2>
      <p>{t("pages.loginRoles.errors.content")}</p>
      <ul>
        <li>{t("pages.loginRoles.errors.invalidPassword")}</li>
        <li>{t("pages.loginRoles.errors.emptyPassword")}</li>
        <li>{t("pages.loginRoles.errors.configError")}</li>
      </ul>

      <h2 id="session">{t("pages.loginRoles.session.title")}</h2>
      <p>{t("pages.loginRoles.session.content")}</p>

      <h2 id="security">{t("pages.loginRoles.security.title")}</h2>
      <p>{t("pages.loginRoles.security.content")}</p>

      <Callout type="note">{t("pages.loginRoles.calloutNote")}</Callout>
    </DocsArticle>
  )
}