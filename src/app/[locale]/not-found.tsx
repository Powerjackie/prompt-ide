import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound")

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="app-panel w-full max-w-2xl p-8 text-center sm:p-10">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            404
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
            {t("description")}
          </p>
          <Button asChild className="mt-2 rounded-2xl">
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}