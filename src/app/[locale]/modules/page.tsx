"use client"

import { useState, useMemo, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Puzzle, Plus, PenSquare, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useModules } from "@/hooks/use-modules"
import { useModuleUIStore } from "@/stores/module-store"
import { deleteModule as deleteModuleAction } from "@/app/actions/module.actions"
import { MODULE_TYPES } from "@/lib/constants"
import { ModuleEditorDialog } from "@/components/modules/module-editor"
import { formatDate, copyToClipboard } from "@/lib/utils"
import type { SerializedModule } from "@/app/actions/module.actions"
import { toast } from "sonner"

export default function ModulesPage() {
  const t = useTranslations("modules")
  const tc = useTranslations("common")
  const { modules, loading, refetch } = useModules()
  const { activeFilter, setActiveFilter } = useModuleUIStore()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<SerializedModule | null>(null)

  const filtered = useMemo(
    () => activeFilter === "all" ? modules : modules.filter((m) => m.type === activeFilter),
    [modules, activeFilter]
  )

  const openCreate = () => {
    setEditingModule(null)
    setDialogOpen(true)
  }

  const openEdit = (mod: SerializedModule) => {
    setEditingModule(mod)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteModuleAction(id)
      if (result.success) {
        toast.success(t("moduleDeleted"))
        refetch()
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={pending ? "opacity-70 pointer-events-none space-y-6" : "space-y-6"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Badge variant="secondary">{modules.length}</Badge>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> {t("newModule")}
        </Button>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={activeFilter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveFilter("all")}
        >
          {t("all")} ({modules.length})
        </Badge>
        {MODULE_TYPES.map((mt) => {
          const count = modules.filter((m) => m.type === mt.value).length
          return (
            <Badge
              key={mt.value}
              variant={activeFilter === mt.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveFilter(mt.value)}
            >
              {mt.label} ({count})
            </Badge>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Puzzle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("noModules")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => {
            const typeLabel = MODULE_TYPES.find((mt) => mt.value === m.type)?.label ?? m.type
            return (
              <div
                key={m.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{m.title}</div>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {typeLabel}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(m.updatedAt)}
                  </span>
                </div>

                <pre className="text-xs font-mono bg-muted/50 rounded p-2 max-h-24 overflow-hidden whitespace-pre-wrap">
                  {m.content}
                </pre>

                {m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => openEdit(m)}
                  >
                    <PenSquare className="h-3 w-3 mr-1" /> {tc("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={async () => {
                      await copyToClipboard(m.content)
                      toast.success(tc("copied"))
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> {tc("copy")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> {tc("delete")}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ModuleEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editModule={editingModule}
        onSaved={refetch}
      />
    </div>
  )
}
