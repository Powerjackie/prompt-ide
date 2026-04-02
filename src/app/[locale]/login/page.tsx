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
    <div className="app-panel overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(14,18,27,0.96),rgba(11,14,23,0.92))] shadow-[0_32px_90px_-48px_rgba(15,23,42,0.7)] dark:border-white/10">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <div className="relative overflow-hidden px-7 py-8 sm:px-10 lg:px-12 lg:py-12">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_60%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_45%)]" />
          <div className="relative space-y-7">
            <div className="page-header border-none bg-transparent p-0 shadow-none">
              <div className="page-header__eyebrow border-primary/20 bg-primary/12 text-primary-foreground/90">
                <Sparkles className="h-3.5 w-3.5" />
                {t("eyebrow")}
              </div>
              <div className="space-y-3">
                <h1 className="page-header__title max-w-[13ch] text-4xl text-white sm:text-5xl">
                  Prompt IDE
                </h1>
                <p className="page-header__description max-w-[54ch] text-base text-white/70 sm:text-lg">
                  {t("description")}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {t("discoveryTitle")}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  {t("discoveryDescription")}
                </p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {t("agentTitle")}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  {t("agentDescription")}
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-white/62 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                {t("highlights.promptCapture")}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                {t("highlights.versionCompare")}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                {t("highlights.skillOperations")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
          <Card className="w-full max-w-[28rem] border-white/10 bg-[linear-gradient(180deg,rgba(18,24,37,0.96),rgba(14,19,31,0.94))] text-white shadow-[0_30px_90px_-40px_rgba(17,24,39,0.75)]">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2 text-white/60">
                <LockKeyhole className="h-4 w-4" />
                <span className="text-sm font-medium">{t("eyebrow")}</span>
              </div>
              <CardTitle className="text-3xl">{t("title")}</CardTitle>
              <p className="text-sm leading-6 text-white/68">{t("description")}</p>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/82">
                    {t("passwordLabel")}
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    autoComplete="current-password"
                    required
                    className="h-12 rounded-2xl border-white/8 bg-white/[0.03] text-white placeholder:text-white/35"
                  />
                </div>

                {state.error ? (
                  <p
                    className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    role="alert"
                  >
                    {t(state.error)}
                  </p>
                ) : null}

                <SubmitButton />
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
