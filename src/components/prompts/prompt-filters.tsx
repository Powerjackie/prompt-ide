"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { Grid2X2, List, Search, SlidersHorizontal, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MODEL_OPTIONS, STATUS_OPTIONS } from "@/lib/constants"
import type { PromptFilters } from "@/hooks/use-prompt-filters"

interface Props {
  filters: PromptFilters
  updateFilter: <K extends keyof PromptFilters>(key: K, value: PromptFilters[K]) => void
  resetFilters: () => void
  allTags: string[]
  view: "card" | "list"
  onViewChange: (v: "card" | "list") => void
  resultCount: number
}

export function PromptFiltersBar({
  filters,
  updateFilter,
  resetFilters,
  allTags,
  view,
  onViewChange,
  resultCount,
}: Props) {
  const t = useTranslations("prompts")
  const tc = useTranslations("common")

  const featuredTags = useMemo(() => allTags.slice(0, 8), [allTags])
  const hasFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.model !== "all" ||
    filters.tag !== "all"

  return (
    <div className="filter-shell">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tc("search")}
              className="h-12 rounded-2xl border-border/70 bg-background/80 pl-11"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value as PromptFilters["status"])}
            >
              <SelectTrigger className="h-11 min-w-36 rounded-2xl bg-background/80">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatus")}</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.model}
              onValueChange={(value) => updateFilter("model", value as PromptFilters["model"])}
            >
              <SelectTrigger className="h-11 min-w-36 rounded-2xl bg-background/80">
                <SelectValue placeholder={t("model")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allModels")}</SelectItem>
                {MODEL_OPTIONS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sort}
              onValueChange={(value) => updateFilter("sort", value as PromptFilters["sort"])}
            >
              <SelectTrigger className="h-11 min-w-40 rounded-2xl bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">{t("recentlyUpdated")}</SelectItem>
                <SelectItem value="created">{t("recentlyCreated")}</SelectItem>
                <SelectItem value="title">{t("alphabetical")}</SelectItem>
                <SelectItem value="lastUsed">{t("lastUsed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
            {tc("promptCount", { count: resultCount })}
          </Badge>
          {hasFilters ? (
            <Button variant="ghost" className="rounded-2xl" onClick={resetFilters}>
              <X className="mr-1 h-4 w-4" />
              Reset
            </Button>
          ) : null}
          <div className="flex items-center rounded-2xl border border-border/70 bg-background/80 p-1">
            <Button
              variant={view === "card" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => onViewChange("card")}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => onViewChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="chip-row">
        <Badge
          variant={filters.tag === "all" ? "default" : "outline"}
          className="cursor-pointer rounded-full px-3 py-1"
          onClick={() => updateFilter("tag", "all")}
        >
          {t("allTags")}
        </Badge>
        {featuredTags.map((tag) => (
          <Badge
            key={tag}
            variant={filters.tag === tag ? "default" : "outline"}
            className="cursor-pointer rounded-full px-3 py-1 transition"
            onClick={() => updateFilter("tag", tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
