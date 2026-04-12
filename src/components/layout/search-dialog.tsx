"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { gsap, useGSAP } from "@/lib/gsap-config"
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
  const shellRef = useRef<HTMLDivElement>(null)
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

  useGSAP(
    () => {
      if (!open) return

      const overlay = document.querySelector("[data-slot='dialog-overlay']")
      const content = document.querySelector("[data-slot='dialog-content']")
      const items = Array.from(document.querySelectorAll("[data-slot='command-item']"))
      const input = document.querySelector("[data-slot='command-input-wrapper']")
      const headings = Array.from(document.querySelectorAll("[cmdk-group-heading]"))
      if (!overlay || !content || !input) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          normal: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.reduced) {
            gsap.set([overlay, content, input, ...items, ...headings], {
              clearProps: "all",
            })
            return
          }

          gsap.set(content, { transformPerspective: 900 })

          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
            .fromTo(
              content,
              { y: 28, autoAlpha: 0, rotateX: -8, scale: 0.96 },
              { y: 0, autoAlpha: 1, rotateX: 0, scale: 1, duration: 0.32 },
              0
            )
            .fromTo(input, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.22 }, 0.08)
            .fromTo(
              headings,
              { x: -10, autoAlpha: 0 },
              { x: 0, autoAlpha: 1, duration: 0.18, stagger: 0.03 },
              0.12
            )
            .fromTo(
              items,
              { y: 12, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.22, stagger: 0.018 },
              0.12
            )
        }
      )

      return () => {
        mm.revert()
      }
    },
    { scope: shellRef, dependencies: [open, activePrompts.length, modules.length] }
  )

  return (
    <div ref={shellRef}>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("dialogTitle")}
        description={t("dialogDescription")}
        className="command-palette-shell brutal-border brutal-shadow-lg max-w-[min(42rem,calc(100%-1.5rem))]! rounded-none! border-[3px]! bg-card! p-0!"
      >
        <Command className="rounded-none! border-0 bg-card p-0">
          <CommandInput placeholder={t("placeholder")} />
          <CommandList className="max-h-[min(65vh,32rem)] px-2 pb-2">
            <CommandEmpty>{tc("noResults")}</CommandEmpty>

            <CommandGroup className="command-palette-group" heading={t("pages")}>
              {PAGES.map((page) => (
                <CommandItem
                  key={page.href}
                  onSelect={() => navigate(page.href)}
                  className="command-palette-item"
                  data-magnet-target
                >
                  <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {tn(page.nameKey)}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup className="command-palette-group" heading={t("prompts")}>
              {activePrompts.map((prompt) => (
                <CommandItem
                  key={prompt.id}
                  onSelect={() => navigate(`/prompts/${prompt.id}`)}
                  className="command-palette-item"
                  data-magnet-target
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
                <CommandGroup className="command-palette-group" heading={t("modules")}>
                  {modules.map((module) => (
                    <CommandItem
                      key={module.id}
                      onSelect={() => navigate("/modules")}
                      className="command-palette-item"
                      data-magnet-target
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
