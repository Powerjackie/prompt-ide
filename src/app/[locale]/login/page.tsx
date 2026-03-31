"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { LockKeyhole } from "lucide-react"
import { loginAction, initialAuthState } from "@/app/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center justify-center">
      <Card className="w-full">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LockKeyhole className="h-4 w-4" />
            <span className="text-sm font-medium">{t("eyebrow")}</span>
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                autoComplete="current-password"
                required
              />
            </div>

            {state.error ? (
              <p className="text-sm text-destructive" role="alert">
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
