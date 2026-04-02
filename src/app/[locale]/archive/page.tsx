"use client"

import { useMemo, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Archive, RotateCcw, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthz } from "@/components/auth/authz-provider"
import { usePrompts } from "@/hooks/use-prompts"
import { PageHeader } from "@/components/layout/page-header"
import {
  setPromptStatus,
  deletePrompt as deletePromptAction,
} from "@/app/actions/prompt.actions"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { Link } from "@/i18n/navigation"

export default function ArchivePage() {
  const t = useTranslations("archive")
  const tc = useTranslations("common")
  const { canDeleteAssets } = useAuthz()
  const { prompts: allPrompts, loading, refetch } = usePrompts()
  const [pending, startTransition] = useTransition()

  const archived = useMemo(
    () => allPrompts.filter((p) => p.status === "archived"),
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
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("pageDescription")}
        actions={<Badge variant="secondary">{t("countLabel", { count: archived.length })}</Badge>}
      />

      {archived.length === 0 ? (
        <div className="app-panel py-14 text-center text-muted-foreground">
          <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {archived.map((p) => (
            <div
              key={p.id}
              className="app-panel space-y-3 rounded-[1.75rem] p-5 transition-colors hover:border-primary/20 hover:bg-accent/20"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link href={`/prompts/${p.id}`} className="font-medium text-sm hover:underline">
                    {p.title}
                  </Link>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(p.updatedAt)}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await setPromptStatus(p.id, "production")
                      if (result.success) {
                        toast.success(tc("restored"))
                        refetch()
                      } else {
                        toast.error(result.error)
                      }
                    })
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> {tc("restore")}
                </Button>
                {canDeleteAssets ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await deletePromptAction(p.id)
                        if (result.success) {
                          toast.success(t("permanentlyDeleted"))
                          refetch()
                        } else {
                          toast.error(result.error)
                        }
                      })
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> {tc("deleteForever")}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
