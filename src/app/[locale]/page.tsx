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
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Prompt R&amp;D
          </>
        }
        title={t("title")}
        description="Build, analyze, benchmark, and package prompts inside a discovery-first workbench designed for iteration."
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
                <Badge variant="outline" className="rounded-full border-primary/15 bg-background/70 px-3 py-1 hover:border-primary/30 hover:bg-primary/8">
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
          hint={`${recentPrompts.length} recent assets`}
        />
        <StatsTile
          label={t("inInbox")}
          value={inboxPrompts.length}
          icon={<Inbox className="h-5 w-5" />}
          hint="Capture first, refine later"
        />
        <StatsTile
          label={t("favorites")}
          value={favoritePrompts.length}
          icon={<Star className="h-5 w-5" />}
          hint="Your reusable prompt shelf"
        />
        <StatsTile
          label={t("modules")}
          value={modules.length}
          icon={<Puzzle className="h-5 w-5" />}
          hint="Reusable building blocks"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="space-y-4">
          <SectionHeader
            title={t("recentPrompts")}
            description="Jump back into the prompts you have touched most recently."
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

        <div className="space-y-6">
          <section className="app-panel p-5">
            <SectionHeader
              title={tn("inbox")}
              description="Fast capture items waiting to be promoted into production-ready prompts."
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/inbox">
                    {tc("viewAll")}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-4 space-y-3">
              {inboxPrompts.length > 0 ? (
                inboxPrompts.slice(0, 3).map((prompt) => (
                  <Link
                    key={prompt.id}
                    href={`/prompts/${prompt.id}`}
                    className="block rounded-2xl border border-border/70 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card"
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
                  {tn("inbox")} is clear for now.
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <Link
              href="/collections"
              className="app-panel flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:border-primary/20"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {tn("collections")}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Group prompts and modules into reusable packs.
                </p>
              </div>
              <LibraryBig className="h-6 w-6 text-primary" />
            </Link>
            <Link
              href="/modules"
              className="app-panel flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:border-primary/20"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {tn("modules")}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Maintain the reusable ingredients behind your best prompts.
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
