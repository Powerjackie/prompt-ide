"use client"

import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Plus,
  Inbox,
  FlaskConical,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PromptCard } from "@/components/prompts/prompt-card"
import { usePrompts } from "@/hooks/use-prompts"
import { useModules } from "@/hooks/use-modules"
import { useMemo } from "react"

export default function HomePage() {
  const t = useTranslations("home")
  const tc = useTranslations("common")
  const tn = useTranslations("nav")
  const { prompts: allPrompts, loading } = usePrompts()
  const { modules } = useModules()
  const moduleCount = modules.length

  const activePrompts = useMemo(
    () => allPrompts.filter((p) => p.status !== "archived"),
    [allPrompts]
  )
  const inboxPrompts = useMemo(
    () => allPrompts.filter((p) => p.status === "inbox"),
    [allPrompts]
  )
  const favoritePrompts = useMemo(
    () => allPrompts.filter((p) => p.isFavorite && p.status !== "archived"),
    [allPrompts]
  )
  const recentPrompts = useMemo(
    () =>
      [...activePrompts]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [activePrompts]
  )

  // Collect all tags with counts
  const tagCounts: Record<string, number> = {}
  allPrompts.forEach((p) => p.tags.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1 }))
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{activePrompts.length}</div>
            <p className="text-xs text-muted-foreground">{t("totalPrompts")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{inboxPrompts.length}</div>
            <p className="text-xs text-muted-foreground">{t("inInbox")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{favoritePrompts.length}</div>
            <p className="text-xs text-muted-foreground">{t("favorites")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{moduleCount}</div>
            <p className="text-xs text-muted-foreground">{t("modules")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/editor">
            <Plus className="h-4 w-4 mr-1" /> {tc("newPrompt")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/inbox">
            <Inbox className="h-4 w-4 mr-1" /> {t("quickCapture")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/playground">
            <FlaskConical className="h-4 w-4 mr-1" /> {tn("playground")}
          </Link>
        </Button>
      </div>

      {/* Inbox Preview */}
      {inboxPrompts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{tn("inbox")}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inbox">{tc("viewAll")} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {inboxPrompts.slice(0, 3).map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Prompts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t("recentPrompts")}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/prompts">{tc("viewAll")} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {recentPrompts.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      </section>

      {/* Favorites */}
      {favoritePrompts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t("favorites")}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/favorites">{tc("viewAll")} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {favoritePrompts.slice(0, 6).map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </section>
      )}

      {/* Tag Shortcuts */}
      {topTags.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">{t("tags")}</h2>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <Link key={tag} href={`/prompts?tag=${tag}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                  {tag} <span className="ml-1 text-muted-foreground">({count})</span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
