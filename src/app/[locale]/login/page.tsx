"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { LockKeyhole, Sparkles } from "lucide-react"
import { loginAction } from "@/app/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initialAuthState } from "@/types/auth"

function SubmitButton() {
  const t = useTranslations("login")
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? t("submitting") : t("submit")}
    </Button>
  )
}

export default function LoginPage() {
  const t = useTranslations("login")
  const [state, formAction] = useActionState(loginAction, initialAuthState)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="space-y-6">
        <div className="page-header border-none bg-transparent p-0 shadow-none">
          <div className="page-header__eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            {t("eyebrow")}
          </div>
          <div className="space-y-3">
            <h1 className="page-header__title max-w-xl">Prompt IDE</h1>
            <p className="page-header__description max-w-2xl">
              {t("description")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="app-panel p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Discovery
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Capture prompts, compare versions, benchmark improvements, and package modules into reusable collections.
            </p>
          </div>
          <div className="app-panel p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              MiniMax Agent
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Analyze, refactor, and benchmark prompts inside one focused workspace built for iteration.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-white/70 bg-card/96 shadow-[0_30px_90px_-40px_rgba(17,24,39,0.55)]">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LockKeyhole className="h-4 w-4" />
            <span className="text-sm font-medium">{t("eyebrow")}</span>
          </div>
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{t("description")}</p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                autoComplete="current-password"
                required
                className="h-12 rounded-2xl bg-background/80"
              />
            </div>

            {state.error ? (
              <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {t(state.error)}
              </p>
            ) : null}

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
