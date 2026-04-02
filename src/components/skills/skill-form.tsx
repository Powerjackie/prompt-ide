"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSkill, updateSkill } from "@/app/actions/skill.actions"
import { MODEL_OPTIONS } from "@/lib/constants"
import { toast } from "sonner"
import { SkillSchemaEditor } from "@/components/skills/skill-schema-editor"
import type { Collection } from "@/types/collection"
import type { SerializedPrompt } from "@/app/actions/prompt.actions"
import type { Skill, SkillFormInput, SkillSchemaMap, SkillStatus } from "@/types/skill"

interface SkillFormProps {
  prompts: SerializedPrompt[]
  collections: Collection[]
  initialSkill?: Skill | null
  onSaved?: (skill: Skill) => void
  onCancel?: () => void
}

const SKILL_STATUSES: SkillStatus[] = ["draft", "active", "archived"]
const NO_COLLECTION = "__none__"

export function SkillForm({
  prompts,
  collections,
  initialSkill,
  onSaved,
  onCancel,
}: SkillFormProps) {
  const t = useTranslations("skills")
  const tc = useTranslations("common")
  const tm = useTranslations("models")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const promptOptions = useMemo(
    () => prompts.filter((prompt) => prompt.status !== "archived"),
    [prompts]
  )

  const [name, setName] = useState(initialSkill?.name ?? "")
  const [description, setDescription] = useState(initialSkill?.description ?? "")
  const [goal, setGoal] = useState(initialSkill?.goal ?? "")
  const [status, setStatus] = useState<SkillStatus>(initialSkill?.status ?? "draft")
  const [entryPromptId, setEntryPromptId] = useState(
    initialSkill?.entryPromptId ?? promptOptions[0]?.id ?? ""
  )
  const [collectionId, setCollectionId] = useState(initialSkill?.collectionId ?? NO_COLLECTION)
  const [recommendedModel, setRecommendedModel] = useState(
    initialSkill?.recommendedModel ?? "universal"
  )
  const [notes, setNotes] = useState(initialSkill?.notes ?? "")
  const [inputSchema, setInputSchema] = useState<SkillSchemaMap>(initialSkill?.inputSchema ?? {})
  const [outputSchema, setOutputSchema] = useState<SkillSchemaMap>(initialSkill?.outputSchema ?? {})

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t("form.nameRequired"))
      return
    }

    if (!entryPromptId) {
      toast.error(t("form.entryPromptRequired"))
      return
    }

    const payload: SkillFormInput = {
      name: name.trim(),
      description: description.trim(),
      goal: goal.trim(),
      status,
      entryPromptId,
      collectionId: collectionId === NO_COLLECTION ? null : collectionId,
      recommendedModel,
      inputSchema,
      outputSchema,
      notes: notes.trim(),
    }

    startTransition(async () => {
      const result = initialSkill
        ? await updateSkill(initialSkill.id, payload)
        : await createSkill(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      onSaved?.(result.data)
      toast.success(initialSkill ? t("updated") : t("created"))

      if (!initialSkill) {
        router.push(`/skills/${result.data.id}`)
      }
    })
  }

  return (
    <Card className="app-panel">
      <CardHeader>
        <CardTitle>{initialSkill ? t("form.editTitle") : t("form.createTitle")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("form.description")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="skill-name">{t("form.nameLabel")}</Label>
            <Input
              id="skill-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("form.namePlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("form.statusLabel")}</Label>
            <Select value={status} onValueChange={(value) => setStatus((value ?? "draft") as SkillStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`status.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="skill-description">{t("form.descriptionLabel")}</Label>
          <Textarea
            id="skill-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("form.descriptionPlaceholder")}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="skill-goal">{t("form.goalLabel")}</Label>
          <Textarea
            id="skill-goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder={t("form.goalPlaceholder")}
            className="min-h-[120px]"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("form.entryPromptLabel")}</Label>
            <Select value={entryPromptId} onValueChange={(value) => setEntryPromptId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("form.entryPromptPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {promptOptions.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("form.collectionLabel")}</Label>
            <Select value={collectionId} onValueChange={(value) => setCollectionId(value ?? NO_COLLECTION)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("form.collectionPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_COLLECTION}>{t("form.noCollection")}</SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("form.recommendedModelLabel")}</Label>
            <Select value={recommendedModel} onValueChange={(value) => setRecommendedModel(value ?? "universal")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {tm(model.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill-notes">{t("form.notesLabel")}</Label>
            <Textarea
              id="skill-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("form.notesPlaceholder")}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SkillSchemaEditor
            label={t("form.inputSchemaLabel")}
            description={t("form.inputSchemaDescription")}
            value={inputSchema}
            onChange={setInputSchema}
            emptyLabel={t("form.schemaEmpty")}
            keyPlaceholder={t("form.schemaFieldPlaceholder")}
            valuePlaceholder={t("form.schemaValuePlaceholder")}
            addLabel={t("form.addSchemaField")}
          />
          <SkillSchemaEditor
            label={t("form.outputSchemaLabel")}
            description={t("form.outputSchemaDescription")}
            value={outputSchema}
            onChange={setOutputSchema}
            emptyLabel={t("form.schemaEmpty")}
            keyPlaceholder={t("form.schemaFieldPlaceholder")}
            valuePlaceholder={t("form.schemaValuePlaceholder")}
            addLabel={t("form.addSchemaField")}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel()
                return
              }
              router.back()
            }}
            disabled={pending}
          >
            {tc("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? t("form.saving") : initialSkill ? tc("save") : tc("create")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
