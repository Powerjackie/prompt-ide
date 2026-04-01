"use client"

import { useEffect, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { SkillForm } from "@/components/skills/skill-form"
import { getCollections } from "@/app/actions/collection.actions"
import { getPrompts, type SerializedPrompt } from "@/app/actions/prompt.actions"
import { toast } from "sonner"
import type { Collection } from "@/types/collection"

export default function NewSkillPage() {
  const t = useTranslations("skills")
  const tc = useTranslations("common")
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const [promptResult, collectionResult] = await Promise.all([getPrompts(), getCollections()])
      if (cancelled) return

      if (promptResult.success) {
        setPrompts(promptResult.data)
      } else {
        toast.error(promptResult.error)
      }

      if (collectionResult.success) {
        setCollections(collectionResult.data)
      } else {
        toast.error(collectionResult.error)
      }

      setLoading(false)
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {t("newSkill")}
          </>
        }
        title={t("form.createTitle")}
        description={t("form.description")}
        actions={
          <Button variant="ghost" size="sm" asChild className="rounded-2xl">
            <Link href="/skills">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {tc("back")}
            </Link>
          </Button>
        }
      />

      <SkillForm prompts={prompts} collections={collections} />
    </div>
  )
}
