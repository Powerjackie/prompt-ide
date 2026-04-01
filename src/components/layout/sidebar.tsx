"use client"

import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
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
  PenSquare,
  Puzzle,
  Settings,
  Sparkles,
  Star,
  Tags,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const t = useTranslations("nav")
  const [collapsed, setCollapsed] = useState(false)
  const [inboxCount, setInboxCount] = useState(0)

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
          "group/nav relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white/80 hover:shadow-sm dark:hover:bg-white/5",
          active
            ? "border border-primary/18 bg-primary/10 text-foreground shadow-[0_18px_40px_-28px_rgba(79,70,229,0.45)]"
            : "border border-transparent text-muted-foreground",
          emphasis && !active && "bg-muted/45 text-foreground/90",
          collapsed && "justify-center px-2.5"
        )}
        title={collapsed ? label : undefined}
      >
        {active ? (
          <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-primary" />
        ) : null}
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-muted-foreground transition-colors",
            active
              ? "border-primary/20 bg-primary text-primary-foreground shadow-sm"
              : "border-border/70 bg-card/70 group-hover/nav:border-primary/15 group-hover/nav:text-primary dark:bg-white/5"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{label}</div>
              {item.href === "/prompts" ? (
                <div className="truncate text-xs text-muted-foreground">Workbench</div>
              ) : item.href === "/playground" ? (
                <div className="truncate text-xs text-muted-foreground">MiniMax Lab</div>
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
        "hidden h-screen shrink-0 border-r border-sidebar-border/70 bg-sidebar/95 px-3 py-4 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[96px]" : "w-[290px]"
      )}
    >
      <div className="flex items-center justify-between gap-3 px-2">
        <Link
          href="/"
          className={cn(
            "group flex min-w-0 items-center gap-3 rounded-3xl border border-primary/15 bg-primary/8 px-3 py-3 transition-all hover:border-primary/25 hover:bg-primary/12",
            collapsed && "justify-center rounded-2xl px-2.5"
          )}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5" />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-wide">Prompt IDE</span>
              <span className="block truncate text-xs text-muted-foreground">
                Discovery workbench
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
        <div className="mt-4 rounded-3xl border border-border/70 bg-card/70 px-4 py-4 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.4)]">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Prompt R&amp;D
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Move from capture to analysis, refactor, benchmark, and packaging in one place.
          </p>
        </div>
      ) : null}

      <nav className="mt-5 flex flex-1 flex-col gap-3 overflow-y-auto pb-3">
        <div className="space-y-2">{primaryItems.map((item) => renderItem(item, item.href === "/prompts"))}</div>
        <div className="soft-divider" />
        <div className="space-y-2">{utilityItems.map((item) => renderItem(item))}</div>
      </nav>

      <div className="mt-auto space-y-3 px-1">
        {!collapsed ? (
          <div className="rounded-3xl border border-border/70 bg-card/75 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Inbox pulse
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold tracking-tight">{inboxCount}</div>
                <div className="text-sm text-muted-foreground">{t("inbox")}</div>
              </div>
              <Link
                href="/inbox"
                className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/12"
              >
                Open
              </Link>
            </div>
          </div>
        ) : null}
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
