"use client"

import { useMemo, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Inbox, ArrowUpRight, Archive, Trash2, Copy, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Badge variant="secondary">{inboxPrompts.length}</Badge>
        </div>
      </div>

      <QuickCapture onCaptured={refetch} />

      {inboxPrompts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inboxPrompts.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-accent/30 transition-colors"
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
                      await setPromptStatus(p.id, "production")
                      toast.success(tc("promoted"))
                      refetch()
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
                    await copyToClipboard(p.content)
                    startTransition(async () => {
                      await markPromptLastUsed(p.id)
                    })
                    toast.success(tc("copied"))
                  }}
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
                      await setPromptStatus(p.id, "archived")
                      toast.success(tc("archived"))
                      refetch()
                    })
                  }}
                >
                  <Archive className="h-3 w-3 mr-1" /> {tc("archive")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await deletePromptAction(p.id)
                      toast.success(tc("deleted"))
                      refetch()
                    })
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> {tc("delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
