"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "@/i18n/navigation"
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
        {children}
        <Toaster />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <TopBar />
      <main id="main-content" className="app-main lab-scroll" data-route={pathname}>
        <div className="app-main__inner">{children}</div>
      </main>
      <SearchDialog />
      <Toaster />
    </div>
  )
}
