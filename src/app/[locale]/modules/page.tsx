"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Copy, PenSquare, Plus, Puzzle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteModule as deleteModuleAction } from "@/app/actions/module.actions"
import type { SerializedModule } from "@/app/actions/module.actions"
import { useAuthz } from "@/components/auth/authz-provider"
import { ModuleEditorDialog } from "@/components/modules/module-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Folio } from "@/components/ui/folio"
import { PageHeader } from "@/components/ui/page-header"
import { PageShell } from "@/components/ui/page-shell"
import { SurfaceCard } from "@/components/ui/surface-card"
import { useModules } from "@/hooks/use-modules"
import { MODULE_TYPES } from "@/lib/constants"
import { copyToClipboard, formatDate } from "@/lib/utils"
import { useModuleUIStore } from "@/stores/module-store"

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
    () => (activeFilter === "all" ? modules : modules.filter((module) => module.type === activeFilter)),
    [modules, activeFilter]
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const openCreate = () => {
    setEditingModule(null)
    setDialogOpen(true)
  }

  const openEdit = (module: SerializedModule) => {
    setEditingModule(module)
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
      <PageShell>
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell width="wide" className={pending ? "pointer-events-none space-y-8 opacity-70" : "space-y-8"}>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Puzzle className="size-4" />
            {t("title")}
          </span>
        }
        title={t("title")}
        description={t("pageDescription")}
        actions={
          <Button onClick={openCreate} data-variant="primary">
            <Plus className="mr-1 size-4" />
            {t("newModule")}
          </Button>
        }
      />

      <SurfaceCard inset className="flex flex-wrap gap-1.5">
        <Badge
          variant={activeFilter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleFilterChange("all")}
        >
          {t("all")} ({modules.length})
        </Badge>
        {MODULE_TYPES.map((type) => {
          const count = modules.filter((module) => module.type === type.value).length
          return (
            <Badge
              key={type.value}
              variant={activeFilter === type.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleFilterChange(type.value)}
            >
              {t(type.value)} ({count})
            </Badge>
          )
        })}
      </SurfaceCard>

      {filtered.length === 0 ? (
        <SurfaceCard className="py-14 text-center text-muted-foreground">
          <Puzzle className="mx-auto mb-3 size-12 opacity-30" />
          <p>{t("noModules")}</p>
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {paged.map((module) => {
            const typeLabel = t(module.type)
            return (
              <SurfaceCard key={module.id} interactive className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Folio>{typeLabel}</Folio>
                    <h2 className="mt-2 line-clamp-1 text-2xl">{module.title}</h2>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(module.updatedAt)}</span>
                </div>

                <pre className="max-h-28 overflow-hidden whitespace-pre-wrap rounded-[var(--radius-sm)] border border-border bg-background p-3 font-mono text-xs">
                  {module.content}
                </pre>

                {module.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {module.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button size="sm" variant="ghost" className="border border-border" onClick={() => openEdit(module)} aria-label={`${tc("edit")} ${module.title}`}>
                    <PenSquare className="mr-1 size-3.5" /> {tc("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border border-border"
                    onClick={async () => {
                      await copyToClipboard(module.content)
                      toast.success(tc("copied"))
                    }}
                    aria-label={`${tc("copy")} ${module.title}`}
                  >
                    <Copy className="mr-1 size-3.5" /> {tc("copy")}
                  </Button>
                  {canDeleteAssets ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="border border-border text-destructive hover:text-destructive"
                      onClick={() => handleDelete(module.id)}
                      aria-label={`${tc("delete")} ${module.title}`}
                    >
                      <Trash2 className="mr-1 size-3.5" /> {tc("delete")}
                    </Button>
                  ) : null}
                </div>
              </SurfaceCard>
            )
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
            Prev
          </Button>
          <span className="font-mono text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button type="button" variant="outline" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      ) : null}

      <ModuleEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editModule={editingModule}
        onSaved={refetch}
      />
    </PageShell>
  )
}
