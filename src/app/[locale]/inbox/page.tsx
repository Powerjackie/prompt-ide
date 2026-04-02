"use client"

import { useMemo, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Inbox, ArrowUpRight, Archive, Trash2, Copy, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/layout/section-header"
import { useAuthz } from "@/components/auth/authz-provider"
import { usePrompts } from "@/hooks/use-prompts"
import {
  setPromptStatus,
  deletePrompt as deletePromptAction,
  markPromptLastUsed,
} from "@/app/actions/prompt.actions"
import { QuickCapture } from "@/components/inbox/quick-capture"
import { formatDate, copyToClipboard } from "@/lib/utils"
import { toast } from "sonner"

export default function InboxPage() {
  const t = useTranslations("inbox")
  const tc = useTranslations("common")
  const { canDeleteAssets } = useAuthz()
  const { prompts: allPrompts, loading, refetch } = usePrompts()
  const [pending, startTransition] = useTransition()

  const inboxPrompts = useMemo(
    () => allPrompts.filter((p) => p.status === "inbox"),
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
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        eyebrow={
          <>
            <Inbox className="h-3.5 w-3.5" />
            {t("title")}
          </>
        }
        title={t("quickCapture")}
        description={t("pageDescription")}
      />

      <div className="app-panel p-6">
        <SectionHeader
          title={t("quickCapture")}
          description={t("captureDescription")}
        />
        <div className="mt-5">
          <QuickCapture onCaptured={refetch} />
        </div>
      </div>

      {inboxPrompts.length === 0 ? (
        <div className="app-panel py-14 text-center text-muted-foreground">
          <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inboxPrompts.map((p) => (
            <div
              key={p.id}
              className="app-panel space-y-3 rounded-[1.75rem] p-5 transition-colors hover:border-primary/20 hover:bg-accent/20"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/prompts/${p.id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {p.title}
                  </Link>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(p.createdAt)}
                </div>
              </div>

              <pre className="text-xs font-mono bg-muted/50 rounded p-2 max-h-24 overflow-hidden whitespace-pre-wrap">
                {p.content}
              </pre>

              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await setPromptStatus(p.id, "production")
                      if (result.success) {
                        toast.success(tc("promoted"))
                        refetch()
                      } else {
                        toast.error(result.error)
                      }
                    })
                  }}
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" /> {tc("promote")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  asChild
                >
                  <Link href={`/editor/${p.id}`}>{tc("edit")}</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={async () => {
                    const ok = await copyToClipboard(p.content)
                    if (!ok) {
                      toast.error(tc("copyFailed"))
                      return
                    }
                    startTransition(async () => {
                      const result = await markPromptLastUsed(p.id)
                      if (!result.success) {
                        toast.error(result.error)
                      }
                    })
                    toast.success(tc("copied"))
                  }}
                  disabled={pending}
                >
                  <Copy className="h-3 w-3 mr-1" /> {tc("copy")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await setPromptStatus(p.id, "archived")
                      if (result.success) {
                        toast.success(tc("archived"))
                        refetch()
                      } else {
                        toast.error(result.error)
                      }
                    })
                  }}
                >
                  <Archive className="h-3 w-3 mr-1" /> {tc("archive")}
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
                          toast.success(tc("deleted"))
                          refetch()
                        } else {
                          toast.error(result.error)
                        }
                      })
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> {tc("delete")}
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
