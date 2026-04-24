"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"

interface LocaleSwitcherProps {
  className?: string
  showLabel?: boolean
}

export function LocaleSwitcher({ className, showLabel = false }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("locale")

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={showLabel ? "default" : "icon"}
            className={cn("rounded-[var(--radius-sm)] border border-border hover:bg-muted", className)}
          />
        }
      >
        <Languages className="h-4 w-4" />
        {showLabel ? (
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">{t(locale)}</span>
        ) : null}
        <span className="sr-only">{t("switchLocale")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={loc === locale ? "font-semibold" : ""}
          >
            {t(loc)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
