import type { ComponentType } from "react"
import {
  BookOpen,
  FileText,
  FlaskConical,
  LayoutDashboard,
  PenSquare,
  Puzzle,
} from "lucide-react"

export interface NavigationItem {
  href: string
  labelKey: string
  icon: ComponentType<{ className?: string }>
}

export const primaryNavigationItems: readonly NavigationItem[] = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/playground", labelKey: "playground", icon: FlaskConical },
  { href: "/prompts", labelKey: "prompts", icon: FileText },
  { href: "/editor", labelKey: "editor", icon: PenSquare },
  { href: "/modules", labelKey: "modules", icon: Puzzle },
  { href: "/docs", labelKey: "docs", icon: BookOpen },
] as const
