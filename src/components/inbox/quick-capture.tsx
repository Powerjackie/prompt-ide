"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createPrompt } from "@/app/actions/prompt.actions"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface QuickCaptureProps {
  onCaptured?: () => void
}

export function QuickCapture({ onCaptured }: QuickCaptureProps) {
  const t = useTranslations("inbox")
  const tc = useTranslations("common")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleCapture = () => {
    if (!content.trim()) {
      toast.error(tc("contentRequired"))
      return
    }
    startTransition(async () => {
      const result = await createPrompt({
        title: title.trim() || "Untitled",
        content: content.trim(),
        status: "inbox",
      })
      if (result.success) {
        setTitle("")
        setContent("")
        setExpanded(false)
        toast.success(t("captured"))
        onCaptured?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (!expanded) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setExpanded(true)}>
        <Plus className="h-4 w-4 mr-1" /> {t("quickCapture")}
      </Button>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="capture-title">{t("captureTitle")}</Label>
        <Input
          id="capture-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("captureTitlePlaceholder")}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="capture-content">{t("captureContent")}</Label>
        <Textarea
          id="capture-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("captureContentPlaceholder")}
          className="min-h-[120px]"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleCapture} disabled={pending}>
          <Plus className="h-4 w-4 mr-1" /> {t("capture")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setExpanded(false)
            setTitle("")
            setContent("")
          }}
        >
          {tc("cancel")}
        </Button>
      </div>
    </div>
  )
}
