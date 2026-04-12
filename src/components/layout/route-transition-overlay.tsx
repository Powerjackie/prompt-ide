"use client"

import { useEffect, useRef } from "react"
import { useLocale } from "next-intl"
import { usePathname } from "@/i18n/navigation"
import { gsap, useGSAP } from "@/lib/gsap-config"
import { NAVIGATION_START_EVENT } from "@/components/layout/motion-events"

function normalizePath(path: string, locale: string) {
  if (!path) return path
  if (path === `/${locale}`) return "/"
  if (path.startsWith(`/${locale}/`)) {
    return path.slice(locale.length + 1) || "/"
  }
  return path
}

export function RouteTransitionOverlay() {
  const pathname = usePathname()
  const locale = useLocale()
  const shellRef = useRef<HTMLDivElement>(null)
  const topPanelRef = useRef<HTMLDivElement>(null)
  const bottomPanelRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const pendingPathRef = useRef<string | null>(null)
  const animatingRef = useRef(false)
  const reducedMotionRef = useRef(false)
  const hideTimerRef = useRef<number | null>(null)
  const closeOverlayRef = useRef<() => void>(() => {})
  const openOverlayRef = useRef<(targetPath?: string) => void>(() => {})

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(
        {
          normal: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          reducedMotionRef.current = Boolean(context.conditions?.reduced)
        }
      )
      gsap.set([topPanelRef.current, bottomPanelRef.current], {
        scaleY: 0,
        transformOrigin: "center top",
      })
      gsap.set(bottomPanelRef.current, { transformOrigin: "center bottom" })
      gsap.set(labelRef.current, { autoAlpha: 0, y: 12 })
      gsap.set(shellRef.current, { autoAlpha: 0 })

      return () => {
        mm.revert()
        if (hideTimerRef.current !== null) {
          window.clearTimeout(hideTimerRef.current)
        }
      }
    },
    { scope: shellRef }
  )

  useEffect(() => {
    closeOverlayRef.current = () => {
      if (!shellRef.current || !topPanelRef.current || !bottomPanelRef.current || !labelRef.current) {
        return
      }

      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }

      if (reducedMotionRef.current) {
        animatingRef.current = false
        pendingPathRef.current = null
        gsap.set(shellRef.current, { autoAlpha: 0 })
        return
      }

      gsap
        .timeline({
          defaults: { duration: 0.32, ease: "power3.out" },
          onComplete: () => {
            animatingRef.current = false
            pendingPathRef.current = null
            gsap.set(shellRef.current, { autoAlpha: 0 })
          },
        })
        .to(labelRef.current, { autoAlpha: 0, y: -8, duration: 0.18 }, 0)
        .to(topPanelRef.current, { scaleY: 0, transformOrigin: "center top" }, 0.06)
        .to(bottomPanelRef.current, { scaleY: 0, transformOrigin: "center bottom" }, 0.06)
    }

    openOverlayRef.current = (targetPath?: string) => {
      if (!shellRef.current || !topPanelRef.current || !bottomPanelRef.current || !labelRef.current) {
        return
      }

      const normalizedTarget = targetPath ? normalizePath(targetPath, locale) : null
      if (normalizedTarget && normalizedTarget === pathname) return
      if (animatingRef.current) return

      pendingPathRef.current = normalizedTarget
      animatingRef.current = true

      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current)
      }

      if (reducedMotionRef.current) {
        gsap.set(shellRef.current, { autoAlpha: 0 })
        animatingRef.current = false
        return
      }

      gsap.killTweensOf([shellRef.current, topPanelRef.current, bottomPanelRef.current, labelRef.current])

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .set(shellRef.current, { autoAlpha: 1 })
        .to(topPanelRef.current, { scaleY: 1, duration: 0.22 }, 0)
        .to(bottomPanelRef.current, { scaleY: 1, duration: 0.22 }, 0)
        .to(labelRef.current, { autoAlpha: 1, y: 0, duration: 0.18 }, 0.1)

      hideTimerRef.current = window.setTimeout(() => {
        closeOverlayRef.current()
      }, 700)
    }
  }, [locale, pathname])

  useEffect(() => {
    const handleNavigationStart = (event: Event) => {
      const detail = (event as CustomEvent<{ targetPath?: string }>).detail
      openOverlayRef.current(detail?.targetPath)
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== "_self") return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return

      openOverlayRef.current(normalizePath(url.pathname, locale))
    }

    window.addEventListener(NAVIGATION_START_EVENT, handleNavigationStart as EventListener)
    document.addEventListener("click", handleDocumentClick, true)

    return () => {
      window.removeEventListener(NAVIGATION_START_EVENT, handleNavigationStart as EventListener)
      document.removeEventListener("click", handleDocumentClick, true)
    }
  }, [locale])

  useEffect(() => {
    if (!animatingRef.current) return
    const targetPath = pendingPathRef.current
    if (targetPath && targetPath !== pathname) return
    closeOverlayRef.current()
  }, [pathname])

  return (
    <div ref={shellRef} aria-hidden="true" className="route-transition-overlay">
      <div ref={topPanelRef} className="route-transition-overlay__panel route-transition-overlay__panel--top" />
      <div ref={labelRef} className="route-transition-overlay__label">
        <span>PROMPT IDE</span>
        <span>ROUTE SHIFT</span>
      </div>
      <div
        ref={bottomPanelRef}
        className="route-transition-overlay__panel route-transition-overlay__panel--bottom"
      />
    </div>
  )
}
