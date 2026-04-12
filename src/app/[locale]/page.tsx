"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  FlaskConical,
  Layers3,
  PencilRuler,
  Puzzle,
  Sparkles,
} from "lucide-react"
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap-config"
import { getRecentVersions, type RecentPromptVersion } from "@/app/actions/prompt-version.actions"
import { getRecentPrompts, type SerializedPrompt } from "@/app/actions/prompt-surface.actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type LocalePrompt = {
  id: string
  title: string
  description: string
  status: string
  updatedAt: string
}

const FEATURE_DEFINITIONS = [
  {
    id: "playground",
    href: "/playground",
    icon: FlaskConical,
  },
  {
    id: "prompts",
    href: "/prompts",
    icon: FileText,
  },
  {
    id: "modules",
    href: "/modules",
    icon: Puzzle,
  },
] as const

function LoadingWorkbench({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="home-workbench-row">
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted/70" />
          <div className="mt-3 h-3 w-1/3 animate-pulse rounded-full bg-muted/50" />
        </div>
      ))}
    </div>
  )
}

function formatPromptStatus(status: string, labels: Record<string, string>) {
  return labels[status] ?? status
}

function formatDateTime(value: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(value))
}

export default function HomePage() {
  const locale = useLocale()
  const t = useTranslations("home")
  const containerRef = useRef<HTMLDivElement>(null)
  const [recentPrompts, setRecentPrompts] = useState<SerializedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [recentVersions, setRecentVersions] = useState<RecentPromptVersion[]>([])
  const [recentVersionsLoading, setRecentVersionsLoading] = useState(true)

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const result = await getRecentPrompts(4)
      if (cancelled) return
      if (result.success) setRecentPrompts(result.data)
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadRecentVersions = async () => {
      const result = await getRecentVersions(4)

      if (cancelled) {
        return
      }

      if (result.success) {
        setRecentVersions(result.data)
      }

      setRecentVersionsLoading(false)
    }

    void loadRecentVersions()

    return () => {
      cancelled = true
    }
  }, [])

  const continueWorkPrompts = recentPrompts as LocalePrompt[]

  const featureCards = useMemo(
    () =>
      FEATURE_DEFINITIONS.map((feature) => ({
        ...feature,
        title: t(`landing.features.${feature.id}.title`),
        strap: t(`landing.features.${feature.id}.strap`),
        body: t(`landing.features.${feature.id}.body`),
        hint: t(`landing.features.${feature.id}.hint`),
      })),
    [t]
  )

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      let titleSplit: SplitText | null = null

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [
            ".gs-home-hero-frame",
            ".gs-home-kicker",
            ".gs-home-title",
            ".gs-home-subcopy",
            ".gs-home-cta",
            ".gs-home-meta",
            ".gs-home-feature-heading",
            ".gs-home-feature-card",
            ".gs-home-workbench",
            ".gs-home-footer",
          ],
          { clearProps: "all", autoAlpha: 1, x: 0, y: 0, scale: 1 }
        )
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let active = true
        let heroTl: gsap.core.Timeline | null = null

        const initHomeMotion = () => {
          if (!active) {
            return
          }

          const shellScroller = document.querySelector(".app-main") as HTMLElement | null
          const isShellScrollerActive =
            Boolean(shellScroller) &&
            window.matchMedia("(min-width: 1024px)").matches &&
            getComputedStyle(shellScroller as HTMLElement).overflowY !== "visible"
          const scroller = isShellScrollerActive ? shellScroller : undefined
          const featureCards = gsap.utils.toArray<HTMLElement>(".gs-home-feature-card", containerRef.current)

          titleSplit = new SplitText(".gs-home-title", { type: "words,lines" })

          gsap.set(".gs-home-hero-frame", { autoAlpha: 0, y: 24 })
          gsap.set(".gs-home-title", { autoAlpha: 1 })
          gsap.set(".gs-home-kicker, .gs-home-subcopy, .gs-home-cta, .gs-home-meta", {
            autoAlpha: 0,
            y: 20,
          })
          gsap.set(titleSplit.words, {
            autoAlpha: 0,
            y: 28,
            rotateX: -85,
            transformOrigin: "0% 100%",
          })

          heroTl = gsap.timeline({ defaults: { ease: "power2.out" } })
          heroTl
            .to(".gs-home-hero-frame", { autoAlpha: 1, y: 0, duration: 0.42 })
            .to(".gs-home-kicker", { autoAlpha: 1, y: 0, duration: 0.28 }, "-=0.18")
            .to(
              titleSplit.words,
              {
                autoAlpha: 1,
                y: 0,
                rotateX: 0,
                duration: 0.58,
                stagger: 0.05,
              },
              "-=0.05"
            )
            .to(".gs-home-subcopy", { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.24")
            .to(".gs-home-cta", { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.08 }, "-=0.18")
            .to(".gs-home-meta", { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.06 }, "-=0.2")
            .eventCallback("onComplete", () => {
              gsap.set(".gs-home-hero-frame, .gs-home-kicker, .gs-home-subcopy, .gs-home-cta, .gs-home-meta", {
                clearProps: "opacity,transform",
              })
              gsap.set(titleSplit?.words ?? [], { clearProps: "opacity,transform" })
            })

          gsap.from(".gs-home-feature-heading", {
            autoAlpha: 0,
            y: 18,
            duration: 0.4,
            scrollTrigger: {
              scroller,
              trigger: ".gs-home-feature-band",
              start: "top 72%",
            },
          })

          if (featureCards.length > 0) {
            gsap.from(featureCards, {
              autoAlpha: 0,
              y: 24,
              duration: 0.42,
              stagger: 0.08,
              ease: "power2.out",
              scrollTrigger: {
                scroller,
                trigger: ".gs-home-feature-track",
                start: "top 70%",
                once: true,
              },
              onComplete: () => {
                gsap.set(featureCards, { visibility: "inherit" })
                gsap.set(featureCards, { clearProps: "opacity,transform" })
              },
            })
          }

          gsap.from(".gs-home-workbench", {
            autoAlpha: 0,
            y: 20,
            duration: 0.4,
            stagger: 0.1,
            scrollTrigger: {
              scroller,
              trigger: ".gs-home-workbench-zone",
              start: "top 72%",
            },
          })

          gsap.from(".gs-home-footer", {
            autoAlpha: 0,
            y: 14,
            duration: 0.3,
            scrollTrigger: {
              scroller,
              trigger: ".gs-home-footer",
              start: "top bottom-=100",
            },
          })

          ScrollTrigger.refresh()
        }

        if (document.fonts?.ready) {
          void document.fonts.ready.then(() => {
            initHomeMotion()
          })
        } else {
          initHomeMotion()
        }

        return () => {
          active = false
          heroTl?.kill()
          titleSplit?.revert()
        }
      })

      return () => {
        titleSplit?.revert()
        mm.revert()
      }
    },
    {
      scope: containerRef,
      dependencies: [continueWorkPrompts.length, recentVersions.length, loading, recentVersionsLoading],
      revertOnUpdate: true,
    }
  )

  return (
    <div ref={containerRef} className="home-landing">
      <section className="home-hero gs-home-hero-frame brutal-border-thick brutal-shadow-xl">
        <div className="home-hero__grid">
          <div className="min-w-0 space-y-6">
            <div className="home-kicker gs-home-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              {t("landing.kicker")}
            </div>

            <div className="space-y-4">
              <h1 className="home-hero__title gs-home-title">{t("landing.title")}</h1>
              <p className="home-hero__body gs-home-subcopy">
                {t("landing.body")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="gs-home-cta h-12 rounded-none border-2 border-border bg-foreground px-5 text-sm font-semibold uppercase tracking-[0.16em] text-background shadow-[6px_6px_0_0_var(--border)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                <Link href="/playground">
                  {t("landing.cta.playground")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="gs-home-cta h-12 rounded-none border-2 border-border px-5 text-sm font-semibold uppercase tracking-[0.16em] hover:bg-muted"
              >
                <Link href="/prompts">
                  {t("landing.cta.library")}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="home-hero__meta">
            <div className="home-meta-block gs-home-meta">
              <span className="home-meta-label">{t("landing.meta.mode.label")}</span>
              <span className="home-meta-value">{t("landing.meta.mode.value")}</span>
            </div>
            <div className="home-meta-block gs-home-meta">
              <span className="home-meta-label">{t("landing.meta.surface.label")}</span>
              <span className="home-meta-value">{t("landing.meta.surface.value")}</span>
            </div>
            <div className="home-meta-block gs-home-meta">
              <span className="home-meta-label">{t("landing.meta.rule.label")}</span>
              <span className="home-meta-value">{t("landing.meta.rule.value")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-feature-band gs-home-feature-band">
        <div className="space-y-4">
          <div className="home-section-intro gs-home-feature-heading">
            <span className="home-kicker">
              <PencilRuler className="h-3.5 w-3.5" />
              {t("landing.featureKicker")}
            </span>
            <h2 className="home-section-title">{t("landing.featureTitle")}</h2>
            <p className="home-section-copy">
              {t("landing.featureBody")}
            </p>
          </div>
        </div>

        <div className="gs-home-feature-pin home-feature-pin">
          <div className="gs-home-feature-track home-feature-track">
            {featureCards.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.href} className="gs-home-feature-card home-feature-card brutal-border-thick brutal-shadow-lg">
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <span className="home-meta-label">{card.strap}</span>
                        <h3 className="home-feature-card__title">{card.title}</h3>
                      </div>
                      <div className="home-feature-card__icon">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    <p className="home-feature-card__body">{card.body}</p>

                    <div className="space-y-2">
                      <span className="home-feature-card__hint">{card.hint}</span>
                      <Button
                        asChild
                        variant="ghost"
                        className="h-11 rounded-none border-2 border-border px-4 text-sm font-semibold uppercase tracking-[0.16em] hover:bg-muted"
                      >
                        <Link href={card.href}>
                          {t("landing.openAction")}
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="gs-home-workbench-zone home-workbench-zone">
        <div className="home-section-intro">
          <span className="home-kicker">
            <Layers3 className="h-3.5 w-3.5" />
            {t("landing.workbench.kicker")}
          </span>
          <h2 className="home-section-title">{t("landing.workbench.title")}</h2>
          <p className="home-section-copy">
            {t("landing.workbench.body")}
          </p>
        </div>

        <div className="home-workbench-grid">
          <section className="gs-home-workbench home-workbench-main brutal-border-thick brutal-shadow-lg">
            <div className="space-y-2">
              <span className="home-meta-label">{t("landing.workbench.continueLabel")}</span>
              <h3 className="home-workbench-title">{t("landing.workbench.continueTitle")}</h3>
              <p className="home-workbench-copy">
                {t("landing.workbench.continueBody")}
              </p>
            </div>

            {loading ? (
              <LoadingWorkbench count={4} />
            ) : continueWorkPrompts.length > 0 ? (
              <div className="space-y-3">
                {continueWorkPrompts.map((prompt) => (
                  <Link key={prompt.id} href={`/prompts/${prompt.id}`} className="home-workbench-row">
                    <div className="min-w-0 space-y-1">
                      <div className="truncate text-base font-semibold">{prompt.title}</div>
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {formatDateTime(prompt.updatedAt, dateFormatter)}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-none border-2 border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground"
                    >
                      {formatPromptStatus(prompt.status, {
                        inbox: t("status.inbox"),
                        production: t("status.production"),
                        archived: t("status.archived"),
                      })}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="home-workbench-empty">{t("landing.workbench.continueEmpty")}</div>
            )}
          </section>

          <div className="space-y-5">
            <section className="gs-home-workbench home-workbench-mini brutal-border brutal-shadow">
              <div className="space-y-2">
                <span className="home-meta-label">{t("landing.workbench.versionLabel")}</span>
                <h3 className="home-workbench-title">{t("landing.workbench.versionTitle")}</h3>
              </div>

              {recentVersionsLoading ? (
                <LoadingWorkbench count={2} />
              ) : recentVersions.length > 0 ? (
                <div className="space-y-3">
                  {recentVersions.map((version) => (
                    <Link key={version.id} href={`/prompts/${version.promptId}`} className="home-workbench-row home-workbench-row--stack">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{version.prompt.title}</div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {version.changeSummary || t("landing.workbench.versionNoSummary")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        <span>v{version.versionNumber}</span>
                        <span>{formatDateTime(version.createdAt, dateFormatter)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="home-workbench-empty">{t("landing.workbench.versionEmpty")}</div>
              )}
            </section>

            <section className="gs-home-workbench home-workbench-mini brutal-border brutal-shadow">
              <div className="space-y-2">
                <span className="home-meta-label">{t("landing.workbench.fastAccessLabel")}</span>
                <h3 className="home-workbench-title">{t("landing.workbench.fastAccessTitle")}</h3>
              </div>
              <div className="space-y-3">
                <Link href="/playground" className="home-access-link">
                  <span className="flex items-center gap-3">
                    <FlaskConical className="h-4 w-4" />
                    <span>{t("landing.workbench.links.playground")}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href="/prompts" className="home-access-link">
                  <span className="flex items-center gap-3">
                    <FileText className="h-4 w-4" />
                    <span>{t("landing.workbench.links.prompts")}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href="/modules" className="home-access-link">
                  <span className="flex items-center gap-3">
                    <Puzzle className="h-4 w-4" />
                    <span>{t("landing.workbench.links.modules")}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>

      <footer className="gs-home-footer home-footer brutal-border">
        <span>{t("landing.footer.primary")}</span>
        <span>{t("landing.footer.secondary")}</span>
      </footer>
    </div>
  )
}
