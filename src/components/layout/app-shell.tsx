"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "@/i18n/navigation"
import { Toaster } from "@/components/ui/sonner"
import { RouteTransitionOverlay } from "@/components/layout/route-transition-overlay"
import { CursorMagnet } from "@/components/layout/cursor-magnet"
import { GlobalMarquee } from "@/components/layout/global-marquee"

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
        {children}
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
              <main id="main-content" className="app-main">
                <div className="app-main__inner">{children}</div>
              </main>
              <GlobalMarquee />
            </div>
          </div>
        </div>
      </div>
      <RouteTransitionOverlay />
      <CursorMagnet />
      <SearchDialog />
      <Toaster />
    </div>
  )
}
