"use client"

import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SubmitButton() {
  const t = useTranslations("login")
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-[var(--radius-sm)] font-semibold"
      data-variant="primary"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {t("submitting")}
        </>
      ) : (
        t("submit")
      )}
    </Button>
  )
}
