import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Callout } from "@/components/docs/callout"
import { DocsArticle } from "@/components/docs/docs-article"
import { docsNavGroups, type DocsHeading, getDocsHref } from "@/components/docs/docs-navigation"

export default async function DocsHomePage() {
  const t = await getTranslations("docs")
  const headings: DocsHeading[] = [
    { id: "browse-by-workflow", text: t("home.sections.browseByWorkflow"), level: 2 },
    { id: "callout-examples", text: t("home.sections.calloutExamples"), level: 2 },
  ]

  return (
    <DocsArticle headings={headings} className="max-w-4xl">
      <h1>{t("welcome.title")}</h1>
      <p>{t("welcome.description")}</p>

      <h2 id="browse-by-workflow">{t("home.sections.browseByWorkflow")}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {docsNavGroups.map((group) => (
          <Card
            key={group.slug}
            className="rounded-[1.6rem] border border-border/70 bg-card/85 shadow-[0_18px_54px_-40px_rgba(15,23,42,0.3)] dark:border-primary/14 dark:bg-[linear-gradient(180deg,rgba(13,18,32,0.9),rgba(17,22,37,0.92))]"
          >
            <CardHeader>
              <CardTitle>{t(group.titleKey)}</CardTitle>
              <CardDescription>{t(group.descriptionKey)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.items.map((item) => (
                <Link
                  key={item.slug}
                  href={getDocsHref(item.slug)}
                  className="flex items-center justify-between rounded-2xl border border-transparent px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/16 hover:bg-primary/8 hover:text-foreground"
                >
                  <span>{t(item.titleKey)}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 id="callout-examples">{t("home.sections.calloutExamples")}</h2>
      <Callout type="tip">{t("home.callouts.tip")}</Callout>
      <Callout type="note">{t("home.callouts.note")}</Callout>
      <Callout type="warning">{t("home.callouts.warning")}</Callout>
    </DocsArticle>
  )
}
