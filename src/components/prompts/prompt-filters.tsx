"use client"

import { useTranslations } from "next-intl"
import { Search, X, LayoutGrid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  const hasFilters =
    filters.search || filters.status !== "all" || filters.model !== "all" || filters.tag !== "all"

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tc("search")}
            className="pl-9 h-9"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(v) => v && updateFilter("status", v as PromptFilters["status"])}
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Model */}
        <Select
          value={filters.model}
          onValueChange={(v) => v && updateFilter("model", v as PromptFilters["model"])}
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder={t("model")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allModels")}</SelectItem>
            {MODEL_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tag */}
        <Select
          value={filters.tag}
          onValueChange={(v) => v && updateFilter("tag", v)}
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder={t("noTags")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTags")}</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sort}
          onValueChange={(v) => v && updateFilter("sort", v as PromptFilters["sort"])}
        >
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">{t("recentlyUpdated")}</SelectItem>
            <SelectItem value="created">{t("recentlyCreated")}</SelectItem>
            <SelectItem value="title">{t("alphabetical")}</SelectItem>
            <SelectItem value="lastUsed">{t("lastUsed")}</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
            <X className="h-3.5 w-3.5 mr-1" />
          </Button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center border rounded-md">
          <Button
            variant={view === "card" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => onViewChange("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => onViewChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{tc("promptCount", { count: resultCount })}</p>
    </div>
  )
}
