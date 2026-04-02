"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { usePrompts } from "@/hooks/use-prompts"
import { useModules } from "@/hooks/use-modules"
import { Link } from "@/i18n/navigation"
import { PageHeader } from "@/components/layout/page-header"

export default function TagsPage() {
  const t = useTranslations("tags")
  const { prompts, loading: promptsLoading } = usePrompts()
  const { modules, loading: modulesLoading } = useModules()
  const loading = promptsLoading || modulesLoading

  const tagCounts = useMemo(() => {
    const counts = new Map<string, { prompts: number; modules: number }>()

    prompts
      .filter((p) => p.status !== "archived")
      .forEach((p) => {
        p.tags.forEach((tag) => {
          const entry = counts.get(tag) || { prompts: 0, modules: 0 }
          entry.prompts++
          counts.set(tag, entry)
        })
      })

    modules.forEach((m) => {
      m.tags.forEach((tag) => {
        const entry = counts.get(tag) || { prompts: 0, modules: 0 }
        entry.modules++
        counts.set(tag, entry)
      })
    })

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, ...count, total: count.prompts + count.modules }))
      .sort((a, b) => b.total - a.total)
  }, [prompts, modules])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("pageDescription")}
        actions={<Badge variant="secondary">{t("countLabel", { count: tagCounts.length })}</Badge>}
      />

      {tagCounts.length === 0 ? (
        <div className="app-panel py-14 text-center text-muted-foreground">
          <Tags className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tagCounts.map(({ tag, prompts: pCount, modules: mCount, total }) => (
            <Link
              key={tag}
              href={`/prompts?tag=${encodeURIComponent(tag)}`}
              className="app-panel rounded-[1.5rem] p-4 transition-colors hover:border-primary/20 hover:bg-accent/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{tag}</span>
                <Badge variant="secondary" className="text-xs">{total}</Badge>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{t("promptCount", { count: pCount })}</span>
                {mCount > 0 && <span>{t("moduleCount", { count: mCount })}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
