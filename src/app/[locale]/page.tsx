"use client"

import { useMemo } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowRight,
  FileText,
  FlaskConical,
  Inbox,
  LibraryBig,
  Plus,
  Puzzle,
  Sparkles,
  Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PromptCard } from "@/components/prompts/prompt-card"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/layout/section-header"
import { StatsTile } from "@/components/layout/stats-tile"
import { usePrompts } from "@/hooks/use-prompts"
import { useModules } from "@/hooks/use-modules"

export default function HomePage() {
  const t = useTranslations("home")
  const tc = useTranslations("common")
  const tn = useTranslations("nav")
  const { prompts: allPrompts, loading } = usePrompts()
  const { modules } = useModules()

  const activePrompts = useMemo(
    () => allPrompts.filter((prompt) => prompt.status !== "archived"),
    [allPrompts]
  )
  const inboxPrompts = useMemo(
    () => allPrompts.filter((prompt) => prompt.status === "inbox"),
    [allPrompts]
  )
  const favoritePrompts = useMemo(
    () => allPrompts.filter((prompt) => prompt.isFavorite && prompt.status !== "archived"),
    [allPrompts]
  )
  const recentPrompts = useMemo(
    () => [...activePrompts].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 6),
    [activePrompts]
  )

  const topTags = useMemo(() => {
    const counts = new Map<string, number>()
    allPrompts.forEach((prompt) =>
      prompt.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
    )
    return [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 8)
  }, [allPrompts])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {t("eyebrow")}
          </>
        }
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button asChild className="rounded-2xl">
              <Link href="/editor">
                <Plus className="mr-1 h-4 w-4" />
                {tc("newPrompt")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/playground">
                <FlaskConical className="mr-1 h-4 w-4" />
                {tn("playground")}
              </Link>
            </Button>
          </>
        }
      >
        <div className="chip-row">
          {topTags.length > 0 ? (
            topTags.map(([tag, count]) => (
              <Link key={tag} href={`/prompts?tag=${tag}`}>
                <Badge variant="outline" className="rounded-full border-primary/15 bg-background/70 px-3 py-1 hover:border-primary/30 hover:bg-primary/8 dark:border-primary/18 dark:bg-background/65 dark:hover:border-primary/28 dark:hover:bg-primary/10">
                  {tag} ({count})
                </Badge>
              </Link>
            ))
          ) : (
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {t("tags")}
            </Badge>
          )}
        </div>
      </PageHeader>

      <section className="grid gap-4 xl:grid-cols-4">
        <StatsTile
          label={t("totalPrompts")}
          value={activePrompts.length}
          icon={<FileText className="h-5 w-5" />}
          hint={t("statsHints.recentAssets", { count: recentPrompts.length })}
        />
        <StatsTile
          label={t("inInbox")}
          value={inboxPrompts.length}
          icon={<Inbox className="h-5 w-5" />}
          hint={t("statsHints.inbox")}
        />
        <StatsTile
          label={t("favorites")}
          value={favoritePrompts.length}
          icon={<Star className="h-5 w-5" />}
          hint={t("statsHints.favorites")}
        />
        <StatsTile
          label={t("modules")}
          value={modules.length}
          icon={<Puzzle className="h-5 w-5" />}
          hint={t("statsHints.modules")}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)] xl:items-start">
        <section className="app-panel space-y-5 p-5 lg:p-6">
          <SectionHeader
            title={t("recentPrompts")}
            description={t("recentDescription")}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/prompts">
                  {tc("viewAll")}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            {recentPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="app-panel space-y-5 p-5 lg:p-6">
          <SectionHeader
              title={tn("inbox")}
              description={t("inboxDescription")}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/inbox">
                    {tc("viewAll")}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <div className="space-y-3">
              {inboxPrompts.length > 0 ? (
                inboxPrompts.slice(0, 3).map((prompt) => (
                  <Link
                    key={prompt.id}
                    href={`/prompts/${prompt.id}`}
                    className="block rounded-2xl border border-border/70 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(9,12,20,0.72),rgba(17,22,37,0.86))] dark:hover:border-primary/24 dark:hover:bg-[linear-gradient(180deg,rgba(17,22,37,0.92),rgba(21,27,46,0.92))]"
                  >
                    <div className="line-clamp-1 font-medium">{prompt.title}</div>
                    {prompt.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {prompt.description}
                      </p>
                    ) : null}
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  {t("inboxEmpty")}
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <Link
              href="/collections"
              className="app-panel flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:border-primary/20 dark:hover:border-primary/24 dark:hover:shadow-[0_24px_60px_-36px_rgba(79,246,255,0.35)]"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {tn("collections")}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("collectionsDescription")}
                </p>
              </div>
              <LibraryBig className="h-6 w-6 text-primary" />
            </Link>
            <Link
              href="/modules"
              className="app-panel flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:border-primary/20 dark:hover:border-primary/24 dark:hover:shadow-[0_24px_60px_-36px_rgba(79,246,255,0.35)]"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {tn("modules")}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("modulesDescription")}
                </p>
              </div>
              <Puzzle className="h-6 w-6 text-primary" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
