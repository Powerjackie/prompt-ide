"use client"

import type { MouseEvent } from "react"
import { useTransition } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ArrowUpRight, Clock, Copy, Sparkles, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toggleFavorite, markPromptLastUsed } from "@/app/actions/prompt.actions"
import { STATUS_OPTIONS } from "@/lib/constants"
import { cn, copyToClipboard, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Prompt } from "@/types/prompt"

export function PromptCard({ prompt }: { prompt: Prompt }) {
  const tc = useTranslations("common")
  const tm = useTranslations("models")
  const ts = useTranslations("status")
  const [pending, startTransition] = useTransition()

  const modelLabel = tm(prompt.model)
  const statusOption = STATUS_OPTIONS.find((option) => option.value === prompt.status)

  const handleCopy = async (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const ok = await copyToClipboard(prompt.content)
    if (!ok) {
      toast.error(tc("copyFailed"))
      return
    }

    startTransition(async () => {
      const result = await markPromptLastUsed(prompt.id)
      if (!result.success) {
        toast.error(result.error)
      }
    })

    toast.success(tc("copied"))
  }

  const handleFavorite = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    startTransition(async () => {
      const result = await toggleFavorite(prompt.id)
      if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Link href={`/prompts/${prompt.id}`} className="block h-full">
      <Card
        className={cn(
          "group h-full rounded-[1.75rem] border-border/70 bg-card/92 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.5)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_30px_90px_-46px_rgba(79,70,229,0.45)] dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(17,22,37,0.98),rgba(21,27,46,0.92))] dark:hover:border-primary/34 dark:hover:shadow-[0_34px_96px_-44px_rgba(79,246,255,0.34),0_0_42px_-22px_rgba(255,79,216,0.18)]",
          pending && "opacity-70"
        )}
      >
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary dark:border-primary/28 dark:bg-primary/14 dark:shadow-[0_0_28px_-14px_rgba(79,246,255,0.68)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="line-clamp-1 text-base font-semibold leading-tight">{prompt.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("inline-block h-2 w-2 rounded-full", statusOption?.color)} />
                  <span>{statusOption ? ts(statusOption.value) : prompt.status}</span>
                  <span aria-hidden>|</span>
                  <span>{modelLabel}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-2xl opacity-70 transition group-hover:opacity-100"
              onClick={handleFavorite}
              disabled={pending}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )}
              />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
            {prompt.description || prompt.content}
          </p>

          <div className="chip-row">
            {prompt.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-full border-primary/12 bg-background/75 px-3 py-1 dark:border-primary/18 dark:bg-background/65"
              >
                {tag}
              </Badge>
            ))}
            {prompt.tags.length > 4 ? (
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                +{prompt.tags.length - 4}
              </Badge>
            ) : null}
          </div>

          <div className="soft-divider" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(prompt.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-2xl"
                onClick={handleCopy}
                disabled={pending}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-transparent text-muted-foreground transition group-hover:border-primary/15 group-hover:bg-primary/8 group-hover:text-primary dark:group-hover:border-primary/24 dark:group-hover:bg-primary/10 dark:group-hover:text-primary dark:group-hover:shadow-[0_0_24px_-16px_rgba(79,246,255,0.75)]">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
