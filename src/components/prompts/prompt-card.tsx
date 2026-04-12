"use client"

import type { MouseEvent } from "react"
import { useTransition } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ArrowUpRight, Clock, Copy, Sparkles, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toggleFavorite, markPromptLastUsed } from "@/app/actions/prompt-surface.actions"
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
    <Card
      className={cn(
        "group h-full rounded-none brutal-border bg-card brutal-shadow-lg transition-transform duration-200 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:rotate-[0.35deg] hover:shadow-none dark:bg-card",
        pending && "opacity-70"
      )}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/prompts/${prompt.id}`}
            className="flex min-w-0 flex-1 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center brutal-border bg-background text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-base font-semibold leading-tight">{prompt.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("inline-block h-2 w-2 rounded-full", statusOption?.color)} />
                <span>{statusOption ? ts(statusOption.value) : prompt.status}</span>
                <span aria-hidden>|</span>
                <span>{modelLabel}</span>
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none border border-border opacity-70 transition group-hover:opacity-100"
            onClick={handleFavorite}
            disabled={pending}
            aria-label={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
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

      <CardContent className="space-y-4 pt-4 sm:space-y-5">
        <Link
          href={`/prompts/${prompt.id}`}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <p className="line-clamp-3 min-h-0 text-sm leading-6 text-muted-foreground sm:min-h-[4.5rem]">
            {prompt.description || prompt.content}
          </p>
        </Link>

        <div className="chip-row">
          {prompt.tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="rounded-none border-border bg-background px-3 py-1 font-mono text-[11px] uppercase"
            >
              {tag}
            </Badge>
          ))}
          {prompt.tags.length > 4 ? (
            <Badge variant="secondary" className="rounded-none px-3 py-1 font-mono text-[11px] uppercase">
              +{prompt.tags.length - 4}
            </Badge>
          ) : null}
        </div>

        <div className="soft-divider" />

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(prompt.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none border border-border"
              onClick={handleCopy}
              disabled={pending}
              aria-label="Copy prompt"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Link
              href={`/prompts/${prompt.id}`}
              className="flex h-9 w-9 items-center justify-center border border-border bg-background text-muted-foreground transition group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:bg-primary group-hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={`Open ${prompt.title}`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
