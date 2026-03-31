"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCollection, updateCollection } from "@/app/actions/collection.actions"
import { toast } from "sonner"
import type { Collection, CollectionType } from "@/types/collection"

interface CollectionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCollection?: Collection | null
  onSaved: (collection: Collection) => void
}

const COLLECTION_TYPES: CollectionType[] = ["workflow", "toolkit", "learning"]

function CollectionFormContent({
  initialCollection,
  onOpenChange,
  onSaved,
}: Omit<CollectionFormDialogProps, "open">) {
  const t = useTranslations("collections.form")
  const tc = useTranslations("common")
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState(initialCollection?.title ?? "")
  const [description, setDescription] = useState(initialCollection?.description ?? "")
  const [type, setType] = useState<CollectionType>(initialCollection?.type ?? "workflow")
  const mode = initialCollection ? "edit" : "create"

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(t("titleRequired"))
      return
    }

    startTransition(async () => {
      const result = initialCollection
        ? await updateCollection(initialCollection.id, {
            title: title.trim(),
            description: description.trim(),
            type,
          })
        : await createCollection({
            title: title.trim(),
            description: description.trim(),
            type,
          })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      onSaved(result.data)
      onOpenChange(false)
      toast.success(mode === "edit" ? t("updated") : t("created"))
    })
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{mode === "edit" ? t("editTitle") : t("createTitle")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="collection-title">{t("titleLabel")}</Label>
          <Input
            id="collection-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("titlePlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="collection-description">{t("descriptionLabel")}</Label>
          <Textarea
            id="collection-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("descriptionPlaceholder")}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("typeLabel")}</Label>
          <Select
            value={type}
            onValueChange={(value) => value && setType(value as CollectionType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_TYPES.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`types.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {tc("cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? t("saving") : mode === "edit" ? tc("save") : tc("create")}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  initialCollection,
  onSaved,
}: CollectionFormDialogProps) {
  const dialogKey = `${initialCollection?.id ?? "new"}-${open ? "open" : "closed"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CollectionFormContent
          key={dialogKey}
          onOpenChange={onOpenChange}
          initialCollection={initialCollection}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  )
}
