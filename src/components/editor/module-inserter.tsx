"use client"

import { useModules } from "@/hooks/use-modules"
import { MODULE_TYPES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { useState } from "react"

interface ModuleInserterProps {
  onInsert: (content: string) => void
}

export function ModuleInserter({ onInsert }: ModuleInserterProps) {
  const { modules, loading } = useModules()
  const [filter, setFilter] = useState<string>("all")

  const filtered = filter === "all" ? modules : modules.filter((m) => m.type === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={filter === "all" ? "default" : "outline"}
          className="cursor-pointer text-[10px]"
          onClick={() => setFilter("all")}
        >
          All
        </Badge>
        {MODULE_TYPES.map((t) => (
          <Badge
            key={t.value}
            variant={filter === t.value ? "default" : "outline"}
            className="cursor-pointer text-[10px]"
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </Badge>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No modules found. Create modules in the Modules page.
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filtered.map((m) => {
            const typeLabel = MODULE_TYPES.find((t) => t.value === m.type)?.label ?? m.type
            return (
              <div
                key={m.id}
                className="border rounded-md p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {typeLabel}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onInsert(m.content)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Insert
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                  {m.content}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
