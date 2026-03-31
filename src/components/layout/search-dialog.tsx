"use client"

import { useEffect, useState, useMemo } from "react"
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
  FileText,
  Puzzle,
  PenSquare,
  Inbox,
  Star,
  Archive,
  Tags,
  Settings,
  FlaskConical,
  LayoutDashboard,
  LibraryBig,
} from "lucide-react"
import { getPrompts, type SerializedPrompt } from "@/app/actions/prompt.actions"
import { getModules, type SerializedModule } from "@/app/actions/module.actions"
import { getCollections } from "@/app/actions/collection.actions"
import type { Collection } from "@/types/collection"

const PAGES = [
  { nameKey: "home", href: "/", icon: LayoutDashboard },
  { nameKey: "prompts", href: "/prompts", icon: FileText },
  { nameKey: "editor", href: "/editor", icon: PenSquare },
  { nameKey: "inbox", href: "/inbox", icon: Inbox },
  { nameKey: "modules", href: "/modules", icon: Puzzle },
  { nameKey: "collections", href: "/collections", icon: LibraryBig },
  { nameKey: "favorites", href: "/favorites", icon: Star },
  { nameKey: "archive", href: "/archive", icon: Archive },
  { nameKey: "tags", href: "/tags", icon: Tags },
  { nameKey: "playground", href: "/playground", icon: FlaskConical },
  { nameKey: "settings", href: "/settings", icon: Settings },
] as const

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [modules, setModules] = useState<SerializedModule[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const t = useTranslations("search")
  const tn = useTranslations("nav")
  const tc = useTranslations("common")

  // Fetch prompts and modules when dialog opens
  useEffect(() => {
    if (!open) return
    getPrompts().then((result) => {
      if (result.success) setPrompts(result.data)
    })
    getModules().then((result) => {
      if (result.success) setModules(result.data)
    })
    getCollections().then((result) => {
      if (result.success) setCollections(result.data)
    })
  }, [open])

  const activePrompts = useMemo(
    () => prompts.filter((p) => p.status !== "archived"),
    [prompts]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const navigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder={t("placeholder")} />
        <CommandList>
          <CommandEmpty>{tc("noResults")}</CommandEmpty>

          <CommandGroup heading={t("pages")}>
            {PAGES.map((page) => (
              <CommandItem key={page.href} onSelect={() => navigate(page.href)}>
                <page.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                {tn(page.nameKey)}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("prompts")}>
            {activePrompts.map((p) => (
              <CommandItem key={p.id} onSelect={() => navigate(`/prompts/${p.id}`)}>
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{p.title}</div>
                  {p.description && (
                    <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {modules.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("modules")}>
                {modules.map((m) => (
                  <CommandItem key={m.id} onSelect={() => navigate("/modules")}>
                    <Puzzle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.type}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {collections.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("collections")}>
                {collections.map((collection) => (
                  <CommandItem
                    key={collection.id}
                    onSelect={() => navigate(`/collections/${collection.id}`)}
                  >
                    <LibraryBig className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{collection.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {collection.description || tn(`collections`)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
