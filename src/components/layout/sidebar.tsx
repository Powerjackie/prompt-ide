"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { LogOut, Plus } from "lucide-react"
import { logoutAction } from "@/app/actions/auth.actions"
import { primaryNavigationItems, type NavigationItem } from "@/components/layout/navigation-items"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("nav")
  const tc = useTranslations("common")

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon
    const active = isActive(item.href)
    const label = t(item.labelKey)

    return (
      <Link
        aria-label={label}
        className={cn(
          "group relative flex h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] text-[10px] no-underline transition-colors",
          active
            ? "bg-[var(--verdigris-wash)] text-[var(--verdigris-deep)]"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        href={item.href}
        key={item.href}
        title={label}
      >
        {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--verdigris)]" /> : null}
        <Icon className="size-4" />
        <span className="hidden lg:block">{label}</span>
      </Link>
    )
  }

  return (
    <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col">
      <div className="flex h-12 items-center justify-center border-b border-border">
        <Link
          aria-label="Prompt IDE"
          className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--rule-strong)] bg-card font-serif text-lg italic text-[var(--verdigris-deep)] no-underline"
          href="/"
          title="Prompt IDE"
        >
          p
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
        {primaryNavigationItems.map((item) => renderItem(item))}
      </nav>

      <div className="space-y-2 border-t border-border p-2">
        <Button asChild className="h-9 w-full px-2" data-variant="primary">
          <Link aria-label={tc("newPrompt")} href="/editor" title={tc("newPrompt")}>
            <Plus className="size-4" />
            <span className="sr-only">{tc("newPrompt")}</span>
          </Link>
        </Button>

        <form action={logoutAction}>
          <input name="locale" type="hidden" value={locale} />
          <Button
            aria-label={t("logout")}
            className="h-9 w-full"
            title={t("logout")}
            type="submit"
            variant="ghost"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </aside>
  )
}
