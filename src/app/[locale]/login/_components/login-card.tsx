"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import { LockKeyhole } from "lucide-react"
import { loginAction } from "@/app/actions/auth.actions"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Folio } from "@/components/ui/folio"
import { SurfaceCard } from "@/components/ui/surface-card"
import { initialAuthState } from "@/types/auth"
import { PasswordInput } from "./password-input"
import { SubmitButton } from "./submit-button"

export function LoginCard() {
  const t = useTranslations("login")
  const [state, formAction] = useActionState(loginAction, initialAuthState)

  return (
    <SurfaceCard className="w-full max-w-[26rem] p-7 sm:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow className="flex items-center gap-2">
            <LockKeyhole className="size-4" />
            {t("eyebrow")}
          </Eyebrow>
          <Folio>access</Folio>
        </div>

        <h1 className="text-4xl sm:text-5xl">Prompt IDE</h1>
        <p className="prose-lab text-muted-foreground">{t("description")}</p>

        <form action={formAction} className="space-y-5">
          <PasswordInput label={t("passwordLabel")} placeholder={t("passwordPlaceholder")} />

          {state.error ? (
            <p
              className="rounded-[var(--radius-sm)] border border-[var(--vermillion)] bg-[var(--vermillion-wash)] px-4 py-3 text-sm text-[var(--vermillion)]"
              role="alert"
              aria-live="assertive"
            >
              {t(state.error)}
            </p>
          ) : null}

          <SubmitButton />
        </form>
      </div>
    </SurfaceCard>
  )
}
