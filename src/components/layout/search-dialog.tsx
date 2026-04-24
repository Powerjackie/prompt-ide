"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  BookOpen,
  FileText,
  Puzzle,
  PenSquare,
  FlaskConical,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react"
import { getPrompts, type SerializedPrompt } from "@/app/actions/prompt-surface.actions"
import { getModules, type SerializedModule } from "@/app/actions/module.actions"
import { emitNavigationStart, SEARCH_DIALOG_OPEN_EVENT } from "@/components/layout/motion-events"

const PAGES = [
  { nameKey: "home", href: "/", icon: LayoutDashboard },
  { nameKey: "playground", href: "/playground", icon: FlaskConical },
  { nameKey: "prompts", href: "/prompts", icon: FileText },
  { nameKey: "editor", href: "/editor", icon: PenSquare },
  { nameKey: "modules", href: "/modules", icon: Puzzle },
  { nameKey: "docs", href: "/docs", icon: BookOpen },
  { nameKey: "admin", href: "/admin", icon: ShieldCheck },
] as const

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [modules, setModules] = useState<SerializedModule[]>([])
  const t = useTranslations("search")
  const tn = useTranslations("nav")
  const tc = useTranslations("common")

  useEffect(() => {
    if (!open) return

    getPrompts().then((result) => {
      if (result.success) setPrompts(result.data)
    })
    getModules().then((result) => {
      if (result.success) setModules(result.data)
    })
  }, [open])

  const activePrompts = useMemo(
    () => prompts.filter((prompt) => prompt.status !== "archived"),
    [prompts]
  )

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener(SEARCH_DIALOG_OPEN_EVENT, handleOpen as EventListener)
    return () => window.removeEventListener(SEARCH_DIALOG_OPEN_EVENT, handleOpen as EventListener)
  }, [])

  const navigate = (href: string) => {
    setOpen(false)
    emitNavigationStart(href)
    router.push(href)
  }

  return (
    <div>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("dialogTitle")}
        description={t("dialogDescription")}
        className="max-w-[min(42rem,calc(100%-1.5rem))]! rounded-[var(--radius-md)]! border border-border! bg-card! p-0! shadow-[var(--shadow-page)]!"
      >
        <Command className="rounded-none! border-0 bg-card p-0">
          <CommandInput placeholder={t("placeholder")} />
          <CommandList className="max-h-[min(65vh,32rem)] px-2 pb-2">
            <CommandEmpty>{tc("noResults")}</CommandEmpty>

            <CommandGroup heading={t("pages")}>
              {PAGES.map((page) => (
                <CommandItem
                  key={page.href}
                  onSelect={() => navigate(page.href)}
                  className="rounded-[var(--radius-sm)]"
                >
                  <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {tn(page.nameKey)}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading={t("prompts")}>
              {activePrompts.map((prompt) => (
                <CommandItem
                  key={prompt.id}
                  onSelect={() => navigate(`/prompts/${prompt.id}`)}
                  className="rounded-[var(--radius-sm)]"
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{prompt.title}</div>
                    {prompt.description ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {prompt.description}
                      </div>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {modules.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading={t("modules")}>
                  {modules.map((module) => (
                    <CommandItem
                      key={module.id}
                      onSelect={() => navigate("/modules")}
                      className="rounded-[var(--radius-sm)]"
                    >
                      <Puzzle className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{module.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{module.type}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
