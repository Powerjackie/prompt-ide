"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { MODULE_TYPES } from "@/lib/constants"
import { createModule, updateModule } from "@/app/actions/module.actions"
import type { SerializedModule } from "@/app/actions/module.actions"
import type { ModuleType } from "@/types/module"
import { toast } from "sonner"

interface ModuleEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editModule?: SerializedModule | null
  onSaved?: () => void
}

export function ModuleEditorDialog({
  open,
  onOpenChange,
  editModule,
  onSaved,
}: ModuleEditorDialogProps) {
  const t = useTranslations("modules")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editModule ? t("editModule") : t("newModule")}</DialogTitle>
        </DialogHeader>
        <ModuleEditorForm
          key={`${editModule?.id ?? "new"}-${open ? "open" : "closed"}`}
          editModule={editModule}
          pending={pending}
          startTransition={startTransition}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  )
}

interface ModuleEditorFormProps {
  editModule?: SerializedModule | null
  pending: boolean
  startTransition: React.TransitionStartFunction
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function ModuleEditorForm({
  editModule,
  pending,
  startTransition,
  onOpenChange,
  onSaved,
}: ModuleEditorFormProps) {
  const t = useTranslations("modules")
  const tc = useTranslations("common")
  const te = useTranslations("editor")
  const [title, setTitle] = useState(editModule?.title ?? "")
  const [type, setType] = useState<ModuleType>((editModule?.type as ModuleType) ?? "role")
  const [content, setContent] = useState(editModule?.content ?? "")
  const [tags, setTags] = useState<string[]>(editModule?.tags ?? [])
  const [tagInput, setTagInput] = useState("")

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed])
    setTagInput("")
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast.error(tc("titleRequired"))
      return
    }
    if (!content.trim()) {
      toast.error(tc("contentRequired"))
      return
    }

    startTransition(async () => {
      if (editModule) {
        const result = await updateModule(editModule.id, {
          title: title.trim(),
          type,
          content: content.trim(),
          tags,
        })
        if (result.success) {
          toast.success(t("moduleUpdated"))
          onOpenChange(false)
          onSaved?.()
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createModule({
          title: title.trim(),
          type,
          content: content.trim(),
          tags,
        })
        if (result.success) {
          toast.success(t("moduleCreated"))
          onOpenChange(false)
          onSaved?.()
        } else {
          toast.error(result.error)
        }
      }
    })
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="mod-title">{t("moduleTitle")}</Label>
        <Input
          id="mod-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("moduleTitlePlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("moduleType")}</Label>
        <Select value={type} onValueChange={(v) => v && setType(v as ModuleType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODULE_TYPES.map((mt) => (
              <SelectItem key={mt.value} value={mt.value}>
                {t(mt.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mod-content">{t("moduleContent")}</Label>
        <Textarea
          id="mod-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("moduleContentPlaceholder")}
          className="min-h-[120px] font-mono text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label>{te("tagsLabel")}</Label>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== tag))}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              addTag(tagInput)
            }
          }}
          placeholder={te("tagsPlaceholder")}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          {tc("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={pending}>
          {editModule ? tc("save") : tc("create")}
        </Button>
      </div>
    </div>
  )
}
