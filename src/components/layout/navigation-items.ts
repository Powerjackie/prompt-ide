import type { ComponentType } from "react"
import {
  Archive,
  FileText,
  FlaskConical,
  Inbox,
  Layers3,
  LayoutDashboard,
  LibraryBig,
  PenSquare,
  Puzzle,
  Settings,
  Star,
  Tags,
} from "lucide-react"

export interface NavigationItem {
  href: string
  labelKey: string
  icon: ComponentType<{ className?: string }>
  badge?: boolean
}

export const primaryNavigationItems: readonly NavigationItem[] = [
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

export const utilityNavigationItems: readonly NavigationItem[] = [
  { href: "/playground", labelKey: "playground", icon: FlaskConical },
  { href: "/settings", labelKey: "settings", icon: Settings },
] as const
