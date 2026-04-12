"use client"

import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SubmitButton() {
  const t = useTranslations("login")
  const { pending } = useFormStatus()

  return (
    <div className="gs-login-submit">
      <Button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-2xl font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </div>
  )
}
