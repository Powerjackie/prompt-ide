"use client"

import { useMemo, useState } from "react"
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
import { cn } from "@/lib/utils"
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

const VISIBLE_TAG_COUNT = 8

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
  const tm = useTranslations("models")
  const ts = useTranslations("status")

  const [tagsExpanded, setTagsExpanded] = useState(false)
  const visibleTags = useMemo(
    () => (tagsExpanded ? allTags : allTags.slice(0, VISIBLE_TAG_COUNT)),
    [allTags, tagsExpanded]
  )
  const hasMoreTags = allTags.length > VISIBLE_TAG_COUNT

  const hasFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.model !== "all" ||
    filters.tag !== "all"

  return (
    <div className="filter-shell brutal-border brutal-shadow bg-card dark:shadow-none">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tc("search")}
              className="h-12 rounded-none brutal-border bg-background pl-11 font-mono text-sm focus-visible:ring-2 focus-visible:ring-ring"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              aria-label={tc("search")}
            />
          </div>

          <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:items-center lg:w-auto">
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value as PromptFilters["status"])}
            >
              <SelectTrigger
                className="h-11 w-full rounded-none brutal-border bg-background font-mono text-xs uppercase sm:min-w-36 sm:w-auto"
                aria-label={t("status")}
              >
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatus")}</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {ts(status.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.model}
              onValueChange={(value) => updateFilter("model", value as PromptFilters["model"])}
            >
              <SelectTrigger
                className="h-11 w-full rounded-none brutal-border bg-background font-mono text-xs uppercase sm:min-w-36 sm:w-auto"
                aria-label={t("model")}
              >
                <SelectValue placeholder={t("model")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allModels")}</SelectItem>
                {MODEL_OPTIONS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {tm(model.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sort}
              onValueChange={(value) => updateFilter("sort", value as PromptFilters["sort"])}
            >
              <SelectTrigger
                className="h-11 w-full rounded-none brutal-border bg-background font-mono text-xs uppercase sm:min-w-40 sm:w-auto"
                aria-label={t("recentlyUpdated")}
              >
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
          <Badge variant="outline" className="rounded-none border-border bg-background px-3 py-1 font-mono text-[11px] uppercase">
            <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
            {tc("promptCount", { count: resultCount })}
          </Badge>
          {hasFilters ? (
            <Button variant="ghost" className="rounded-none border border-border" onClick={resetFilters}>
              <X className="mr-1 h-4 w-4" />
              {tc("reset")}
            </Button>
          ) : null}
          <div className="hidden items-center brutal-border bg-background p-1 md:flex">
            <Button
              variant={view === "card" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => onViewChange("card")}
              aria-label="Card view"
              aria-pressed={view === "card"}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => onViewChange("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="chip-row">
        <Badge
          variant={filters.tag === "all" ? "default" : "outline"}
          className={cn(
            "cursor-pointer rounded-none border-2 border-border px-3 py-1 font-mono text-[11px] uppercase transition-transform hover:translate-x-[2px] hover:translate-y-[2px]",
            filters.tag === "all" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
          )}
          onClick={() => updateFilter("tag", "all")}
        >
          {t("allTags")}
        </Badge>
        {visibleTags.map((tag) => (
          <Badge
            key={tag}
            variant={filters.tag === tag ? "default" : "outline"}
            className={cn(
              "cursor-pointer rounded-none border-2 border-border px-3 py-1 font-mono text-[11px] uppercase transition-transform hover:translate-x-[2px] hover:translate-y-[2px]",
              filters.tag === tag ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
            )}
            onClick={() => updateFilter("tag", tag)}
          >
            {tag}
          </Badge>
        ))}
        {hasMoreTags && (
          <Badge
            variant="outline"
            className="cursor-pointer rounded-none border-2 border-dashed border-border bg-background px-3 py-1 font-mono text-[11px] uppercase text-muted-foreground transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:text-foreground"
            onClick={() => setTagsExpanded((prev) => !prev)}
          >
            {tagsExpanded ? "−" : `+${allTags.length - VISIBLE_TAG_COUNT}`}
          </Badge>
        )}
      </div>
    </div>
  )
}
