"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"

interface AppShellProps {
  children: ReactNode
}

const AUTH_ROUTES = new Set(["/login"])
const Sidebar = dynamic(() => import("@/components/layout/sidebar").then((mod) => mod.Sidebar), {
  ssr: false,
})
const TopBar = dynamic(() => import("@/components/layout/top-bar").then((mod) => mod.TopBar), {
  ssr: false,
})
const SearchDialog = dynamic(
  () => import("@/components/layout/search-dialog").then((mod) => mod.SearchDialog),
  { ssr: false }
)

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.has(pathname)

  if (isAuthRoute) {
    return (
      <div className="auth-shell">
        <div className="relative z-10 w-full max-w-[1080px]">{children}</div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app-shell__viewport">
        <div className="app-shell__grid">
          <div className="app-shell__sidebar-frame">
            <Sidebar />
          </div>
          <div className="app-shell__main-frame">
            <div className="app-shell__content">
              <TopBar />
              <main className="app-main">
                <div className={cn("app-main__inner")}>{children}</div>
              </main>
            </div>
          </div>
        </div>
      </div>
      <SearchDialog />
      <Toaster />
    </div>
  )
}
