"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { DocsHeading } from "@/components/docs/docs-navigation"

interface DocsTocProps {
  headings: DocsHeading[]
}

export function DocsToc({ headings }: DocsTocProps) {
  const t = useTranslations("docs.toc")
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

  const visibleHeadings = useMemo(
    () => headings.filter((heading) => heading.level === 2 || heading.level === 3),
    [headings]
  )

  useEffect(() => {
    if (visibleHeadings.length === 0) return

    const elements = visibleHeadings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element))

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0]

        if (visibleEntry?.target?.id) {
          setActiveId(visibleEntry.target.id)
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.2, 0.6, 1],
      }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [visibleHeadings])

  if (visibleHeadings.length === 0) return null

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-6 rounded-[1.7rem] border border-border/70 bg-card/80 p-4 shadow-[0_18px_54px_-38px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-primary/16 dark:bg-[linear-gradient(180deg,rgba(13,18,32,0.94),rgba(17,22,37,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(0,0,0,0.88),0_0_24px_-18px_rgba(79,246,255,0.32)]">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("onThisPage")}
        </div>
        <nav className="mt-4 space-y-1.5">
          {visibleHeadings.map((heading) => (
            <button
              key={heading.id}
              type="button"
              className={cn(
                "block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                heading.level === 3 && "pl-6 text-[13px]",
                activeId === heading.id
                  ? "bg-primary/10 text-foreground ring-1 ring-primary/20 dark:bg-primary/12"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              onClick={() => {
                document.getElementById(heading.id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
                setActiveId(heading.id)
              }}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
