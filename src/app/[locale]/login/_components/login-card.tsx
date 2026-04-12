"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import { LockKeyhole } from "lucide-react"
import { loginAction } from "@/app/actions/auth.actions"
import { initialAuthState } from "@/types/auth"
import { PasswordInput } from "./password-input"
import { SubmitButton } from "./submit-button"

export function LoginCard() {
  const t = useTranslations("login")
  const [state, formAction] = useActionState(loginAction, initialAuthState)

  return (
    <div className="gs-login-card login-glass-card w-full max-w-[26rem] p-7 sm:p-8">
      <div className="space-y-6">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-white/60">
          <LockKeyhole className="h-4 w-4" />
          <span className="text-sm font-medium tracking-wide">{t("eyebrow")}</span>
        </div>

        {/* Title — SplitText target */}
        <h1 className="gs-login-title font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Prompt IDE
        </h1>

        {/* Description */}
        <p className="gs-login-desc text-sm leading-6 text-white/60">
          {t("description")}
        </p>

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <PasswordInput
            label={t("passwordLabel")}
            placeholder={t("passwordPlaceholder")}
          />

          {state.error ? (
            <p
              className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
              aria-live="assertive"
            >
              {t(state.error)}
            </p>
          ) : null}

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
