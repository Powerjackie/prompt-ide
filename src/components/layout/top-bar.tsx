"use client"

import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Sun, Moon, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { LocaleSwitcher } from "./locale-switcher"

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const tc = useTranslations("common")

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      {/* Search trigger */}
      <Button
        variant="outline"
        className="w-64 justify-start gap-2 text-muted-foreground"
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }))
        }}
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">{tc("search")}</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" asChild>
          <Link href="/editor">
            <Plus className="h-4 w-4 mr-1" />
            {tc("newPrompt")}
          </Link>
        </Button>
        <LocaleSwitcher />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}
