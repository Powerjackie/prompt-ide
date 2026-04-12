"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { LogOut, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/actions/auth.actions"
import { primaryNavigationItems, type NavigationItem } from "@/components/layout/navigation-items"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("nav")
  const tc = useTranslations("common")

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon
    const active = isActive(item.href)
    const label = t(item.labelKey)

    return (
      <Link
        key={item.href}
        href={item.href}
        title={label}
        aria-label={label}
        className={cn(
          "group relative flex h-12 items-center justify-center rounded-none border-y-2 border-transparent transition-transform hover:translate-x-[2px] hover:translate-y-[2px]",
          active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
        )}
        data-magnet-target
      >
        {active ? <span className="absolute inset-y-0 left-0 w-1 bg-primary" /> : null}
        <Icon className={cn("h-4 w-4", active ? "text-background" : "text-current")} />
      </Link>
    )
  }

  return (
    <aside className="hidden h-full w-full bg-card lg:flex lg:flex-col">
      <div className="flex h-20 items-center justify-center border-b-2 border-border">
        <Link
          href="/"
          title="Prompt IDE"
          aria-label="Prompt IDE"
          className="flex h-12 w-12 items-center justify-center border-2 border-border bg-foreground text-background"
          data-magnet-target
        >
          <Sparkles className="h-4 w-4" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-3 py-4">
        {primaryNavigationItems.map((item) => renderItem(item))}
      </nav>

      <div className="border-t-2 border-border px-3 py-3">
        <Button
          asChild
          className="h-auto w-full rounded-none border-2 border-border bg-foreground px-2 py-3 text-background shadow-[4px_4px_0_0_var(--border)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          <Link href="/editor" title={tc("newPrompt")} aria-label={tc("newPrompt")} data-magnet-target>
            <span className="flex flex-col items-center gap-1 text-center">
              <Plus className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                {tc("newPrompt")}
              </span>
            </span>
          </Link>
        </Button>

        <form action={logoutAction} className="mt-3">
          <input type="hidden" name="locale" value={locale} />
          <Button
            type="submit"
            variant="ghost"
            title={t("logout")}
            aria-label={t("logout")}
            className="h-11 w-full rounded-none border-2 border-transparent px-0 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
            data-magnet-target
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </aside>
  )
}
