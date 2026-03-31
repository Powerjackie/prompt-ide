"use client"

import { useTransition } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Star, Copy, Clock } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatDate, copyToClipboard } from "@/lib/utils"
import { toggleFavorite, markPromptLastUsed } from "@/app/actions/prompt.actions"
import { toast } from "sonner"
import type { Prompt } from "@/types/prompt"
import { MODEL_OPTIONS, STATUS_OPTIONS } from "@/lib/constants"

export function PromptCard({ prompt }: { prompt: Prompt }) {
  const tc = useTranslations("common")
  const [pending, startTransition] = useTransition()

  const modelLabel = MODEL_OPTIONS.find((m) => m.value === prompt.model)?.label ?? prompt.model
  const statusOption = STATUS_OPTIONS.find((s) => s.value === prompt.status)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = await copyToClipboard(prompt.content)
    if (ok) {
      startTransition(async () => {
        const result = await markPromptLastUsed(prompt.id)
        if (!result.success) {
          toast.error(result.error)
        }
      })
      toast.success(tc("copied"))
      return
    }

    toast.error("Failed to copy")
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      const result = await toggleFavorite(prompt.id)
      if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Link href={`/prompts/${prompt.id}`}>
      <Card className={cn("group h-full transition-colors hover:border-primary/30 hover:shadow-sm", pending && "opacity-70")}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1">{prompt.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleFavorite}
              disabled={pending}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )}
              />
            </Button>
          </div>
          {prompt.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{prompt.description}</p>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {prompt.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {prompt.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{prompt.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                {modelLabel}
              </Badge>
              <span className={cn("inline-block h-1.5 w-1.5 rounded-full", statusOption?.color)} />
              <span>{statusOption?.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
                disabled={pending}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Clock className="h-3 w-3" />
              <span>{formatDate(prompt.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
