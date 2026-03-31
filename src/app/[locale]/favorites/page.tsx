"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { usePrompts } from "@/hooks/use-prompts"
import { PromptCard } from "@/components/prompts/prompt-card"

export default function FavoritesPage() {
  const t = useTranslations("favorites")
  const { prompts: allPrompts, loading } = usePrompts()
  const favorites = useMemo(
    () => allPrompts.filter((p) => p.isFavorite && p.status !== "archived"),
    [allPrompts]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Badge variant="secondary">{favorites.length}</Badge>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}
    </div>
  )
}
