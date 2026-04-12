"use client"

import { useTranslations } from "next-intl"
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
import { X } from "lucide-react"
import { MODEL_OPTIONS, STATUS_OPTIONS, CATEGORY_OPTIONS } from "@/lib/constants"
import type { ModelType, PromptStatus } from "@/types/prompt"
import { useState } from "react"

export interface MetadataValues {
  title: string
  description: string
  model: ModelType
  status: PromptStatus
  category: string
  source: string
  tags: string[]
  notes: string
}

interface MetadataFormProps {
  values: MetadataValues
  onChange: (values: MetadataValues) => void
}

export function MetadataForm({ values, onChange }: MetadataFormProps) {
  const t = useTranslations("editor")
  const tp = useTranslations("prompts")
  const tm = useTranslations("models")
  const ts = useTranslations("status")
  const tcg = useTranslations("categories")
  const [tagInput, setTagInput] = useState("")

  const update = <K extends keyof MetadataValues>(key: K, val: MetadataValues[K]) => {
    onChange({ ...values, [key]: val })
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !values.tags.includes(trimmed)) {
      update("tags", [...values.tags, trimmed])
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    update("tags", values.tags.filter((x) => x !== tag))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">{t("titleLabel")}</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder={t("titlePlaceholder")}
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t("descriptionLabel")}</Label>
        <Input
          id="description"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          className="rounded-2xl"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="editor-model">{tp("model")}</Label>
          <Select value={values.model} onValueChange={(v) => v && update("model", v as ModelType)}>
            <SelectTrigger id="editor-model" className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {tm(m.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editor-status">{tp("status")}</Label>
          <Select value={values.status} onValueChange={(v) => v && update("status", v as PromptStatus)}>
            <SelectTrigger id="editor-status" className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {ts(s.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editor-category">{tp("category")}</Label>
          <Select value={values.category} onValueChange={(v) => v && update("category", v)}>
            <SelectTrigger id="editor-category" className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {tcg(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="source">{t("sourceLabel")}</Label>
        <Input
          id="source"
          value={values.source}
          onChange={(e) => update("source", e.target.value)}
          placeholder={t("sourcePlaceholder")}
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tag-input">{t("tagsLabel")}</Label>
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/25 p-3">
          <div className="mb-2 flex min-h-8 flex-wrap gap-1.5">
            {values.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 rounded-full">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                  aria-label={`${t("tagsLabel")}: ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            id="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                addTag(tagInput)
              }
            }}
            placeholder={t("tagsPlaceholder")}
            className="rounded-2xl border-border/70 bg-background/80"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">{t("notesLabel")}</Label>
        <Textarea
          id="notes"
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder={t("notesPlaceholder")}
          className="min-h-[92px] rounded-[1.5rem]"
        />
      </div>
    </div>
  )
}
