"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { useTheme } from "@/components/theme-provider"
import { Moon, Plus, Search, Sparkles, Sun } from "lucide-react"

const PATH_LABEL_MAP: Record<string, string> = {
  "/": "home",
  "/prompts": "prompts",
  "/editor": "editor",
  "/inbox": "inbox",
  "/modules": "modules",
  "/collections": "collections",
  "/favorites": "favorites",
  "/archive": "archive",
  "/tags": "tags",
  "/playground": "playground",
  "/settings": "settings",
}

export function TopBar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const tc = useTranslations("common")
  const tn = useTranslations("nav")

  const activeLabel = useMemo(() => {
    if (pathname === "/") return tn("home")

    const matchedPrefix = Object.keys(PATH_LABEL_MAP)
      .filter((key) => key !== "/" && pathname.startsWith(key))
      .sort((left, right) => right.length - left.length)[0]

    return matchedPrefix ? tn(PATH_LABEL_MAP[matchedPrefix]) : tn("prompts")
  }, [pathname, tn])

  const launchSearch = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }))
  }

  return (
    <header className="relative z-10 border-b border-border/60 bg-background/75 px-4 py-4 backdrop-blur-xl dark:border-primary/12 dark:bg-[linear-gradient(180deg,rgba(10,14,24,0.96),rgba(14,20,34,0.9))] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Badge variant="outline" className="hidden rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary dark:border-primary/28 dark:bg-[linear-gradient(135deg,rgba(79,246,255,0.16),rgba(106,124,255,0.14))] dark:shadow-[0_0_28px_-14px_rgba(79,246,255,0.9)] sm:inline-flex">
            <Sparkles className="mr-1 h-3 w-3" />
            {activeLabel}
          </Badge>
          <Button
            variant="outline"
            className="h-12 w-full max-w-xl justify-start gap-3 rounded-2xl border-border/70 bg-card/80 px-4 text-left text-muted-foreground shadow-sm hover:bg-card dark:border-primary/18 dark:bg-[linear-gradient(180deg,rgba(16,24,42,0.98),rgba(17,28,48,0.94))] dark:hover:border-primary/34 dark:hover:bg-[linear-gradient(180deg,rgba(18,31,55,0.99),rgba(22,38,67,0.95))] dark:hover:[box-shadow:0_0_0_1px_rgba(79,246,255,0.16),0_0_0_3px_rgba(79,246,255,0.05),0_24px_48px_-24px_rgba(79,246,255,0.58),0_0_34px_-16px_rgba(255,79,216,0.16)] dark:focus-visible:[box-shadow:0_0_0_1px_rgba(79,246,255,0.34),0_0_0_3px_rgba(79,246,255,0.14),0_0_24px_-8px_rgba(79,246,255,0.96),0_0_34px_-12px_rgba(106,124,255,0.72),0_0_42px_-16px_rgba(255,79,216,0.54)] lg:flex"
            onClick={launchSearch}
          >
            <Search className="h-4 w-4" />
            <span className="truncate text-sm">{tc("search")}</span>
            <span className="ml-auto rounded-full border border-border/80 bg-muted px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground dark:border-primary/16 dark:bg-background/80 dark:text-primary/85">
              Ctrl K
            </span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild className="h-11 rounded-2xl px-4 shadow-lg shadow-primary/15 dark:shadow-[0_22px_56px_-18px_rgba(79,246,255,0.7),0_0_36px_-18px_rgba(255,79,216,0.22)]">
            <Link href="/editor">
              <Plus className="mr-1 h-4 w-4" />
              {tc("newPrompt")}
            </Link>
          </Button>
          <LocaleSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl border border-transparent hover:border-border hover:bg-card/80 dark:hover:border-primary/28 dark:hover:bg-primary/10 dark:hover:text-primary dark:hover:[box-shadow:0_0_0_1px_rgba(79,246,255,0.16),0_0_0_3px_rgba(79,246,255,0.04),0_0_20px_-12px_rgba(79,246,255,0.56),0_0_28px_-16px_rgba(255,79,216,0.22)] dark:focus-visible:[box-shadow:0_0_0_1px_rgba(79,246,255,0.34),0_0_0_3px_rgba(79,246,255,0.14),0_0_24px_-8px_rgba(79,246,255,0.96),0_0_34px_-12px_rgba(106,124,255,0.72),0_0_42px_-16px_rgba(255,79,216,0.54)]"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
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
