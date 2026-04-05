import { getTranslations } from "next-intl/server"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import type { DocsHeading } from "@/components/docs/docs-navigation"

export default async function DocsAdvancedSkillsPage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "what-is-a-skill", text: t("pages.skills.whatIs.title"), level: 2 },
    { id: "skill-structure", text: t("pages.skills.structure.title"), level: 2 },
    { id: "creating-a-skill", text: t("pages.skills.create.title"), level: 2 },
    { id: "skill-runner", text: t("pages.skills.runner.title"), level: 2 },
    { id: "presets", text: t("pages.skills.presets.title"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings}>
      <h1>{t("pages.skills.title")}</h1>
      <p>{t("pages.skills.intro")}</p>

      <h2 id="what-is-a-skill">{t("pages.skills.whatIs.title")}</h2>
      <p>{t("pages.skills.whatIs.content")}</p>

      <h2 id="skill-structure">{t("pages.skills.structure.title")}</h2>
      <p>{t("pages.skills.structure.content")}</p>
      <ul>
        <li>{t("pages.skills.structure.name")}</li>
        <li>{t("pages.skills.structure.description")}</li>
        <li>{t("pages.skills.structure.goal")}</li>
        <li>{t("pages.skills.structure.entryPrompt")}</li>
        <li>{t("pages.skills.structure.model")}</li>
        <li>{t("pages.skills.structure.schema")}</li>
        <li>{t("pages.skills.structure.status")}</li>
      </ul>

      <h2 id="creating-a-skill">{t("pages.skills.create.title")}</h2>
      <p>{t("pages.skills.create.content")}</p>

      <h2 id="skill-runner">{t("pages.skills.runner.title")}</h2>
      <p>{t("pages.skills.runner.content")}</p>
      <ul>
        <li>{t("pages.skills.runner.fields")}</li>
        <li>{t("pages.skills.runner.preview")}</li>
        <li>{t("pages.skills.runner.run")}</li>
        <li>{t("pages.skills.runner.results")}</li>
      </ul>

      <h2 id="presets">{t("pages.skills.presets.title")}</h2>
      <p>{t("pages.skills.presets.content")}</p>

      <Callout type="tip">{t("pages.skills.calloutTip")}</Callout>
    </DocsArticle>
  )
}