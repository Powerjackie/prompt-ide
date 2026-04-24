"use client"

import type { MouseEvent } from "react"
import { useTransition } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ArrowUpRight, Clock, Copy, Star } from "lucide-react"
import { toast } from "sonner"
import { markPromptLastUsed, toggleFavorite } from "@/app/actions/prompt-surface.actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Folio } from "@/components/ui/folio"
import { StatusDot } from "@/components/ui/status-dot"
import { SurfaceCard } from "@/components/ui/surface-card"
import { STATUS_OPTIONS } from "@/lib/constants"
import { cn, copyToClipboard, formatDate } from "@/lib/utils"
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
      if (!result.success) toast.error(result.error)
    })
    toast.success(tc("copied"))
  }

  const handleFavorite = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    startTransition(async () => {
      const result = await toggleFavorite(prompt.id)
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <SurfaceCard interactive className={cn("flex h-full flex-col gap-5", pending && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <Link className="min-w-0 flex-1 no-underline" href={`/prompts/${prompt.id}`}>
          <Folio>{modelLabel}</Folio>
          <h3 className="mt-2 line-clamp-2 text-xl">{prompt.title}</h3>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 border border-border"
          onClick={handleFavorite}
          disabled={pending}
          aria-label={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={cn(
              "size-4",
              prompt.isFavorite ? "fill-[var(--amber-rule)] text-[var(--amber-rule)]" : "text-muted-foreground"
            )}
          />
        </Button>
      </div>

      <Link className="block flex-1 no-underline" href={`/prompts/${prompt.id}`}>
        <p className="ui-body line-clamp-4 text-muted-foreground">{prompt.description || prompt.content}</p>
      </Link>

      <div className="flex flex-wrap gap-1.5">
        {prompt.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="outline" className="font-mono text-[10px]">
            {tag}
          </Badge>
        ))}
        {prompt.tags.length > 4 ? (
          <Badge variant="secondary" className="font-mono text-[10px]">
            +{prompt.tags.length - 4}
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="space-y-1">
          <StatusDot tone={prompt.status === "archived" ? "archived" : "active"}>
            {statusOption ? ts(statusOption.value) : prompt.status}
          </StatusDot>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {formatDate(prompt.updatedAt)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 border border-border"
            onClick={handleCopy}
            disabled={pending}
            aria-label="Copy prompt"
          >
            <Copy className="size-3.5" />
          </Button>
          <Link
            href={`/prompts/${prompt.id}`}
            className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background text-muted-foreground no-underline hover:bg-accent hover:text-foreground"
            aria-label={`Open ${prompt.title}`}
          >
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </SurfaceCard>
  )
}
