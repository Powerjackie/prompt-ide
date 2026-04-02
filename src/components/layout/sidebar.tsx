"use client"

import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  LibraryBig,
  Layers3,
  LogOut,
  PenSquare,
  Puzzle,
  Settings,
  Sparkles,
  Star,
  Tags,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/actions/auth.actions"
import { useAuthz } from "@/components/auth/authz-provider"
import { getPrompts } from "@/app/actions/prompt.actions"
import { cn } from "@/lib/utils"

const primaryItems = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/prompts", labelKey: "prompts", icon: FileText },
  { href: "/editor", labelKey: "editor", icon: PenSquare },
  { href: "/inbox", labelKey: "inbox", icon: Inbox, badge: true },
  { href: "/modules", labelKey: "modules", icon: Puzzle },
  { href: "/collections", labelKey: "collections", icon: LibraryBig },
  { href: "/skills", labelKey: "skills", icon: Layers3 },
  { href: "/favorites", labelKey: "favorites", icon: Star },
  { href: "/archive", labelKey: "archive", icon: Archive },
  { href: "/tags", labelKey: "tags", icon: Tags },
] as const

const utilityItems = [
  { href: "/playground", labelKey: "playground", icon: FlaskConical },
  { href: "/settings", labelKey: "settings", icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("nav")
  const { canManageSettings } = useAuthz()
  const [collapsed, setCollapsed] = useState(false)
  const [inboxCount, setInboxCount] = useState(0)
  const visibleUtilityItems = canManageSettings
    ? utilityItems
    : utilityItems.filter((item) => item.href !== "/settings")

  useEffect(() => {
    let cancelled = false

    async function loadInboxCount() {
      const result = await getPrompts()
      if (cancelled || !result.success) return
      setInboxCount(result.data.filter((prompt) => prompt.status === "inbox").length)
    }

    void loadInboxCount()

    return () => {
      cancelled = true
    }
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const renderItem = (
    item: {
      href: string
      labelKey: string
      icon: ComponentType<{ className?: string }>
      badge?: boolean
    },
    emphasis?: boolean
  ) => {
    const Icon = item.icon
    const active = isActive(item.href)
    const label = t(item.labelKey)

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group/nav relative flex items-center gap-3 rounded-2xl px-2 py-2.5 text-sm transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white/80 hover:shadow-sm dark:hover:border-primary/30 dark:hover:bg-primary/10 dark:hover:[box-shadow:0_0_0_1px_rgba(79,246,255,0.16),0_0_0_3px_rgba(79,246,255,0.04),0_30px_60px_-36px_rgba(79,246,255,0.7),0_0_24px_-12px_rgba(255,79,216,0.24)] dark:focus-visible:[box-shadow:0_0_0_1px_rgba(79,246,255,0.34),0_0_0_3px_rgba(79,246,255,0.14),0_0_24px_-8px_rgba(79,246,255,0.96),0_0_34px_-12px_rgba(106,124,255,0.72),0_0_42px_-16px_rgba(255,79,216,0.54)]",
          active
            ? "border border-primary/18 bg-primary/10 text-foreground shadow-[0_18px_40px_-28px_rgba(79,70,229,0.45)] dark:border-primary/40 dark:bg-[linear-gradient(135deg,rgba(79,246,255,0.18),rgba(106,124,255,0.12))] dark:shadow-[0_30px_62px_-34px_rgba(79,246,255,0.62)]"
            : "border border-transparent text-muted-foreground",
          emphasis && !active && "bg-muted/45 text-foreground/90 dark:bg-secondary/82",
          collapsed && "justify-center px-2.5"
        )}
        title={collapsed ? label : undefined}
      >
        {active ? (
          <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-primary shadow-[0_0_20px_rgba(79,246,255,0.85)]" />
        ) : null}
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-muted-foreground transition-colors",
            active
              ? "border-primary/20 bg-primary text-primary-foreground shadow-sm dark:border-primary/45 dark:bg-primary/20 dark:text-primary dark:shadow-[0_0_34px_-10px_rgba(79,246,255,0.9)]"
              : "border-border/70 bg-card/70 group-hover/nav:border-primary/15 group-hover/nav:text-primary dark:border-primary/12 dark:bg-white/[0.03] dark:group-hover/nav:border-primary/28 dark:group-hover/nav:bg-primary/12 dark:group-hover/nav:[box-shadow:0_0_0_1px_rgba(79,246,255,0.16),0_0_0_3px_rgba(79,246,255,0.04),0_0_20px_-12px_rgba(79,246,255,0.64),0_0_26px_-16px_rgba(255,79,216,0.22)]"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{label}</div>
              {item.href === "/prompts" ? (
                <div className="truncate text-xs text-muted-foreground">{t("promptsSubtitle")}</div>
              ) : item.href === "/playground" ? (
                <div className="truncate text-xs text-muted-foreground">{t("playgroundSubtitle")}</div>
              ) : null}
            </div>
            {item.badge && inboxCount > 0 ? (
              <Badge variant={active ? "default" : "secondary"}>{inboxCount}</Badge>
            ) : null}
          </>
        ) : null}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 bg-transparent px-2 py-2 transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[72px]" : "w-[236px]"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-0.5">
        <Link
          href="/"
            className={cn(
            "group flex min-w-0 items-center gap-3 rounded-[1.6rem] border border-primary/15 bg-primary/8 px-2 py-2 transition-all hover:border-primary/25 hover:bg-primary/12",
            "dark:border-primary/26 dark:bg-[linear-gradient(135deg,rgba(79,246,255,0.16),rgba(106,124,255,0.14))] dark:hover:border-primary/36 dark:hover:bg-[linear-gradient(135deg,rgba(79,246,255,0.22),rgba(255,79,216,0.12))] dark:hover:shadow-[0_30px_60px_-38px_rgba(79,246,255,0.58)]",
            collapsed && "justify-center rounded-2xl px-2.5"
          )}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 dark:shadow-[0_0_44px_-10px_rgba(79,246,255,0.95)]">
            <Sparkles className="h-5 w-5" />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-wide">Prompt IDE</span>
              <span className="block truncate text-xs text-muted-foreground">
                {t("brandTagline")}
              </span>
            </span>
          ) : null}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-10 w-10 rounded-2xl xl:inline-flex"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed ? (
          <div className="mt-2.5 rounded-[1.45rem] border border-border/70 bg-card/70 px-2.5 py-2.5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.4)] dark:border-primary/16 dark:bg-[linear-gradient(180deg,rgba(79,246,255,0.08),rgba(21,27,46,0.9))] dark:shadow-[0_30px_64px_-38px_rgba(0,0,0,0.88),0_0_30px_-26px_rgba(79,246,255,0.34)]">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("sidebarPitchTitle")}
          </div>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            {t("sidebarPitchDescription")}
          </p>
        </div>
      ) : null}

      <nav className="shell-scroll mt-3 flex flex-1 flex-col gap-1.5 overflow-y-auto pb-1.5">
        <div className="space-y-2">{primaryItems.map((item) => renderItem(item, item.href === "/prompts"))}</div>
        <div className="soft-divider" />
        <div className="space-y-2">{visibleUtilityItems.map((item) => renderItem(item))}</div>
      </nav>

      <div className="mt-auto space-y-3 px-1">
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              "w-full rounded-2xl border border-transparent text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
          >
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed ? t("logout") : null}
          </Button>
        </form>
        <Button
          variant="ghost"
          className={cn(
            "w-full rounded-2xl border border-transparent text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="mr-2 h-4 w-4" />}
          {!collapsed ? t("collapse") : null}
        </Button>
      </div>
    </aside>
  )
}
