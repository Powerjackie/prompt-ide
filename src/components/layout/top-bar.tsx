"use client"

import { useState } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { LogOut, Menu, Moon, Plus, Search, Sun } from "lucide-react"
import { logoutAction } from "@/app/actions/auth.actions"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { emitSearchDialogOpen } from "@/components/layout/motion-events"
import { primaryNavigationItems } from "@/components/layout/navigation-items"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Folio } from "@/components/ui/folio"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function routeTitle(pathname: string, nav: ReturnType<typeof useTranslations>) {
  const item =
    primaryNavigationItems.find((candidate) =>
      candidate.href === "/" ? pathname === "/" : pathname.startsWith(candidate.href)
    ) ?? primaryNavigationItems[0]
  return nav(item.labelKey)
}

export function TopBar() {
  const pathname = usePathname()
  const { setTheme } = useTheme()
  const tc = useTranslations("common")
  const tn = useTranslations("nav")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const currentTitle = routeTitle(pathname, tn)

  const handleThemeToggle = () => {
    const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark"
    setTheme(nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
    document.documentElement.style.colorScheme = nextTheme
  }

  return (
    <header className="flex h-12 items-center border-b border-border bg-background px-3 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="size-9 border border-border lg:hidden" />
            }
          >
            <Menu className="size-4" />
            <span className="sr-only">{tn("home")}</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(88vw,22rem)] border-r border-border bg-card p-0">
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="font-serif text-lg italic">Prompt IDE</SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
              <nav className="space-y-1">
                {primaryNavigationItems.map((item) => {
                  const Icon = item.icon
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 no-underline",
                        active ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                      )}
                      href={item.href}
                      key={item.href}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon className="size-4" />
                      <span>{tn(item.labelKey)}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-auto space-y-3 pt-6">
                <LocaleSwitcher showLabel className="h-10 w-full justify-start px-3" />
                <Button asChild className="w-full" data-variant="primary">
                  <Link href="/editor" onClick={() => setMobileNavOpen(false)}>
                    <Plus className="size-4" />
                    {tc("newPrompt")}
                  </Link>
                </Button>
                <form action={logoutAction}>
                  <Button type="submit" variant="ghost" className="w-full justify-start px-3">
                    <LogOut className="mr-2 size-4" />
                    {tn("logout")}
                  </Button>
                </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 items-baseline gap-2">
          <Folio>prompt ide</Folio>
          <span className="text-muted-foreground">/</span>
          <span className="truncate font-serif text-base font-semibold">{currentTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-9 border border-border px-3 text-left sm:min-w-48 sm:justify-between"
          onClick={emitSearchDialogOpen}
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" />
            <span className="hidden sm:inline">{tc("search")}</span>
          </span>
          <kbd className="hidden sm:inline-block">Ctrl K</kbd>
        </Button>
        <LocaleSwitcher className="size-9" />
        <Button variant="ghost" size="icon" className="relative size-9 border border-border" onClick={handleThemeToggle}>
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{tn("toggleTheme")}</span>
        </Button>
      </div>
    </header>
  )
}
