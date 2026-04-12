"use client"

import { useState, useMemo, useTransition, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Puzzle, Plus, PenSquare, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/page-header"
import { useAuthz } from "@/components/auth/authz-provider"
import { useModules } from "@/hooks/use-modules"
import { useModuleUIStore } from "@/stores/module-store"
import { deleteModule as deleteModuleAction } from "@/app/actions/module.actions"
import { MODULE_TYPES } from "@/lib/constants"
import { ModuleEditorDialog } from "@/components/modules/module-editor"
import { formatDate, copyToClipboard } from "@/lib/utils"
import type { SerializedModule } from "@/app/actions/module.actions"
import { toast } from "sonner"
import { BrutalCard } from "@/components/ui/brutal-card"

const PAGE_SIZE = 12

export default function ModulesPage() {
  const t = useTranslations("modules")
  const tc = useTranslations("common")
  const { canDeleteAssets } = useAuthz()
  const { modules, loading, refetch } = useModules()
  const { activeFilter, setActiveFilter } = useModuleUIStore()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<SerializedModule | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    document.title = "Modules | Prompt IDE"
  }, [])

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    setPage(1)
  }

  const filtered = useMemo(
    () => activeFilter === "all" ? modules : modules.filter((m) => m.type === activeFilter),
    [modules, activeFilter]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
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
      } else {
        toast.error(result.error)
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
    <div className={pending ? "pointer-events-none space-y-8 opacity-70" : "space-y-8"}>
      <PageHeader
        eyebrow={
          <>
            <Puzzle className="h-3.5 w-3.5" />
            {t("title")}
          </>
        }
        title={t("title")}
        description={t("pageDescription")}
        actions={
          <Button onClick={openCreate} className="rounded-2xl">
            <Plus className="mr-1 h-4 w-4" />
            {t("newModule")}
          </Button>
        }
      >
        <div className="chip-row">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {t("assetCount", { count: modules.length })}
          </Badge>
        </div>
      </PageHeader>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={activeFilter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleFilterChange("all")}
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
              onClick={() => handleFilterChange(mt.value)}
            >
              {t(mt.value)} ({count})
            </Badge>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <BrutalCard shadow="none" padding="none" className="py-14 text-center text-muted-foreground">
          <Puzzle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("noModules")}</p>
        </BrutalCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paged.map((m) => {
            const typeLabel = t(m.type)
            return (
              <BrutalCard
                key={m.id}
                shadow="lg"
                hover="shift"
                className="space-y-3"
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
                    aria-label={`${tc("edit")} ${m.title}`}
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
                    aria-label={`${tc("copy")} ${m.title}`}
                  >
                    <Copy className="h-3 w-3 mr-1" /> {tc("copy")}
                  </Button>
                  {canDeleteAssets ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDelete(m.id)}
                      aria-label={`${tc("delete")} ${m.title}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> {tc("delete")}
                    </Button>
                  ) : null}
                </div>
              </BrutalCard>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="brutal-border brutal-shadow-sm px-4 py-2 font-mono text-sm font-semibold disabled:opacity-40 disabled:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          >
            ←
          </button>
          <span className="font-mono text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="brutal-border brutal-shadow-sm px-4 py-2 font-mono text-sm font-semibold disabled:opacity-40 disabled:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          >
            →
          </button>
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
