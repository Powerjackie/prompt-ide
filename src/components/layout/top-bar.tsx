"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { LogOut, Menu, Moon, Plus, Search, Sparkles, Sun } from "lucide-react"
import { logoutAction } from "@/app/actions/auth.actions"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { primaryNavigationItems } from "@/components/layout/navigation-items"
import { emitSearchDialogOpen } from "@/components/layout/motion-events"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { cn } from "@/lib/utils"

export function TopBar() {
  const pathname = usePathname()
  const { setTheme } = useTheme()
  const tc = useTranslations("common")
  const tn = useTranslations("nav")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const launchSearch = () => {
    emitSearchDialogOpen()
  }

  const handleThemeToggle = () => {
    const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark"
    setTheme(nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
    document.documentElement.style.colorScheme = nextTheme
  }

  return (
    <header className="border-b-2 border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-none border-2 border-border lg:hidden"
                />
              }
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">{tn("home")}</span>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[min(88vw,22rem)] border-r-2 border-border bg-card p-0 text-foreground"
            >
              <SheetHeader className="border-b-2 border-border px-5 py-4">
                <SheetTitle className="flex items-center gap-2 text-base font-semibold uppercase tracking-[0.16em]">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Prompt IDE
                </SheetTitle>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
                <nav className="space-y-2">
                  {primaryNavigationItems.map((item) => {
                    const Icon = item.icon
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "relative flex items-center gap-3 border-2 border-transparent px-3 py-3 text-sm font-medium transition-transform hover:translate-x-[2px] hover:translate-y-[2px]",
                          active ? "bg-foreground text-background" : "hover:border-border hover:bg-muted"
                        )}
                        data-magnet-target
                      >
                        {active ? <span className="absolute inset-y-0 left-0 w-1 bg-primary" /> : null}
                        <Icon className="h-4 w-4" />
                        <span>{tn(item.labelKey)}</span>
                      </Link>
                    )
                  })}
                </nav>

                <div className="mt-auto space-y-3 pt-6">
                  <LocaleSwitcher showLabel className="h-11 w-full justify-start px-3" />

                  <Link
                    href="/editor"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center gap-2 border-2 border-border bg-foreground px-3 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background shadow-[4px_4px_0_0_var(--border)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    data-magnet-target
                  >
                    <Plus className="h-4 w-4" />
                    {tc("newPrompt")}
                  </Link>

                  <form action={logoutAction}>
                    <Button type="submit" variant="ghost" className="w-full justify-start rounded-none border-2 border-transparent px-3 hover:border-border hover:bg-muted">
                      <LogOut className="mr-2 h-4 w-4" />
                      {tn("logout")}
                    </Button>
                  </form>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-foreground"
            data-magnet-target
          >
            <span className="inline-flex h-9 w-9 items-center justify-center border-2 border-border bg-foreground text-background">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="hidden sm:inline">Prompt IDE</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-11 rounded-none border-2 border-border px-3 text-left hover:bg-muted sm:min-w-[12rem] sm:justify-between"
            onClick={launchSearch}
            data-magnet-target
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{tc("search")}</span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              ⌘K
            </span>
          </Button>
          <LocaleSwitcher className="h-11 w-11" />
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 rounded-none border-2 border-border hover:bg-muted"
            onClick={handleThemeToggle}
            data-magnet-target
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{tn("toggleTheme")}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
