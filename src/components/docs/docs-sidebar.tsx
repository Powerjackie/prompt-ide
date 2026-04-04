"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { BookOpen, ChevronDown, ChevronRight, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { docsNavGroups, getDocsHref } from "@/components/docs/docs-navigation"

interface DocsSidebarProps {
  mobile?: boolean
}

function DocsSidebarNav({
  currentPath,
  closeOnSelect = false,
}: {
  currentPath: string
  closeOnSelect?: boolean
}) {
  const t = useTranslations("docs")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    docsNavGroups.reduce<Record<string, boolean>>((acc, group) => {
      const isCurrentGroup = group.items.some((item) => currentPath === getDocsHref(item.slug))
      acc[group.slug] = isCurrentGroup || currentPath === "/docs"
      return acc
    }, {})
  )

  return (
    <nav className="shell-scroll min-h-0 flex-1 space-y-2 overflow-y-auto">
      {docsNavGroups.map((group) => {
        const isOpen = openGroups[group.slug] ?? false
        const isCurrentGroup = group.items.some((item) => currentPath === getDocsHref(item.slug))

        return (
          <div key={group.slug} className="rounded-[1.4rem] border border-border/70 bg-card/70 p-2.5 dark:border-primary/12 dark:bg-background/35">
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left transition-colors",
                isCurrentGroup
                  ? "bg-primary/10 text-foreground ring-1 ring-primary/16"
                  : "text-foreground hover:bg-muted/60"
              )}
              onClick={() =>
                setOpenGroups((value) => ({
                  ...value,
                  [group.slug]: !isOpen,
                }))
              }
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">{t(group.titleKey)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t(group.descriptionKey)}</div>
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
            {isOpen ? (
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const href = getDocsHref(item.slug)
                  const active = currentPath === href

                  if (closeOnSelect) {
                    return (
                      <SheetClose
                        key={item.slug}
                        nativeButton={false}
                        render={
                          <Link
                            href={href}
                            className={cn(
                              "block rounded-xl px-3 py-2 text-sm transition-colors",
                              active
                                ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          />
                        }
                      >
                        {t(item.titleKey)}
                      </SheetClose>
                    )
                  }

                  return (
                    <Link
                      key={item.slug}
                      href={href}
                      className={cn(
                        "block rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      {t(item.titleKey)}
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export function DocsSidebar({ mobile = false }: DocsSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("docs")
  const currentPath = useMemo(() => pathname.replace(/\/$/, ""), [pathname])

  if (mobile) {
    return (
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="outline" className="w-full justify-start rounded-2xl lg:hidden" />
          }
        >
          <Menu className="mr-2 h-4 w-4" />
          {t("title")}
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(88vw,24rem)] border-border/70 bg-card/96 p-0 text-foreground"
        >
          <SheetHeader className="border-b border-border/70 px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              {t("title")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
            <DocsSidebarNav currentPath={currentPath} closeOnSelect />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="sticky top-4 flex max-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-[1.7rem] border border-border/70 bg-card/80 p-4 shadow-[0_18px_54px_-38px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-primary/16 dark:bg-[linear-gradient(180deg,rgba(13,18,32,0.94),rgba(17,22,37,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(0,0,0,0.88),0_0_24px_-18px_rgba(79,246,255,0.32)]">
      <div className="mb-4 flex items-center gap-2 px-1">
        <BookOpen className="h-4 w-4 text-primary" />
        <div className="text-sm font-semibold tracking-tight">{t("title")}</div>
      </div>
      <DocsSidebarNav currentPath={currentPath} />
    </div>
  )
}
