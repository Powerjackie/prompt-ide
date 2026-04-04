"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ChevronRight } from "lucide-react"
import { docsNavGroups, getDocsHref } from "@/components/docs/docs-navigation"

export function DocsBreadcrumb() {
  const pathname = usePathname()
  const t = useTranslations("docs")
  const normalized = pathname.replace(/\/$/, "")
  const matchedGroup = docsNavGroups.find((group) =>
    group.items.some((item) => normalized === getDocsHref(item.slug))
  )
  const matchedItem = matchedGroup?.items.find((item) => normalized === getDocsHref(item.slug)) ?? null

  return (
    <nav aria-label={t("breadcrumb.docs")} className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/docs" className="transition hover:text-foreground">
        {t("breadcrumb.docs")}
      </Link>
      {matchedGroup ? (
        <>
          <ChevronRight className="h-4 w-4" />
          <span>{t(matchedGroup.titleKey)}</span>
        </>
      ) : null}
      {matchedItem ? (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{t(matchedItem.titleKey)}</span>
        </>
      ) : null}
    </nav>
  )
}
