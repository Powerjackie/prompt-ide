"use client"

import { Link } from "@/i18n/navigation"
import { usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  Inbox,
  Puzzle,
  Star,
  Archive,
  Tags,
  FlaskConical,
  Settings,
  LibraryBig,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { getPrompts } from "@/app/actions/prompt.actions"

const navItems = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/prompts", labelKey: "prompts", icon: FileText },
  { href: "/editor", labelKey: "editor", icon: PenSquare },
  { href: "/inbox", labelKey: "inbox", icon: Inbox, showBadge: true },
  { href: "/modules", labelKey: "modules", icon: Puzzle },
  { href: "/collections", labelKey: "collections", icon: LibraryBig },
  { href: "/favorites", labelKey: "favorites", icon: Star },
  { href: "/archive", labelKey: "archive", icon: Archive },
  { href: "/tags", labelKey: "tags", icon: Tags },
] as const

const bottomItems = [
  { href: "/playground", labelKey: "playground", icon: FlaskConical },
  { href: "/settings", labelKey: "settings", icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [inboxCount, setInboxCount] = useState(0)
  const t = useTranslations("nav")

  // Fetch inbox count from DB
  useEffect(() => {
    getPrompts().then((result) => {
      if (result.success) {
        setInboxCount(result.data.filter((p) => p.status === "inbox").length)
      }
    })
  }, [pathname]) // Refetch on navigation

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const renderItem = (item: { href: string; labelKey: string; icon: React.ComponentType<{ className?: string }>; showBadge?: boolean }) => {
    const Icon = item.icon
    const active = isActive(item.href)
    const label = t(item.labelKey)

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{label}</span>
            {item.showBadge && inboxCount > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1 text-xs">
                {inboxCount}
              </Badge>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-14 items-center border-b px-3", collapsed && "justify-center px-2")}>
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <PenSquare className="h-5 w-5 text-primary" />
            <span>Prompt IDE</span>
          </Link>
        ) : (
          <Link href="/">
            <PenSquare className="h-5 w-5 text-primary" />
          </Link>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map(renderItem)}
      </nav>

      {/* Bottom nav */}
      <div className="space-y-1 border-t p-2">
        {bottomItems.map(renderItem)}
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center px-2" : "justify-start")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>{t("collapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
