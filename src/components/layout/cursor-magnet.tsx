"use client"

import { useEffect, useRef } from "react"
import { gsap, useGSAP } from "@/lib/gsap-config"

const MAGNET_SELECTOR = [
  "[data-magnet-target]",
  "main a[href]",
  "main button:not([disabled])",
  "[data-slot='command-item']",
  "[data-slot='dialog-close']",
].join(",")

export function CursorMagnet() {
  const shellRef = useRef<HTMLDivElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const activeTargetRef = useRef<HTMLElement | null>(null)
  const enabledRef = useRef(false)
  const visibleRef = useRef(false)
  const listenersBoundRef = useRef(false)
  const syncToTargetRef = useRef<(target: HTMLElement | null) => void>(() => {})

  useGSAP(
    () => {
      if (!nodeRef.current) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          enabled: "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
          disabled: "(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)",
        },
        (context) => {
          enabledRef.current = Boolean(context.conditions?.enabled)
          gsap.set(nodeRef.current, {
            autoAlpha: 0,
            xPercent: -50,
            yPercent: -50,
            width: 18,
            height: 18,
            scale: 1,
            borderRadius: 2,
            rotate: 0,
          })
        }
      )

      return () => {
        mm.revert()
      }
    },
    { scope: shellRef }
  )

  useEffect(() => {
    if (typeof window === "undefined" || !nodeRef.current) return

    const enabledQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    )

    syncToTargetRef.current = (target: HTMLElement | null) => {
      if (!nodeRef.current || !enabledRef.current) return

      activeTargetRef.current = target

      if (!target) {
        gsap.to(nodeRef.current, {
          width: 18,
          height: 18,
          borderRadius: 2,
          rotate: 0,
          duration: 0.22,
          ease: "power2.out",
        })
        return
      }

      const rect = target.getBoundingClientRect()
      gsap.to(nodeRef.current, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: Math.max(26, rect.width + 14),
        height: Math.max(26, rect.height + 14),
        borderRadius: 0,
        rotate: rect.width > rect.height ? -1.2 : 1.2,
        duration: 0.24,
        ease: "power3.out",
        overwrite: "auto",
      })
    }

    const xTo = gsap.quickTo(nodeRef.current, "x", { duration: 0.16, ease: "power3.out" })
    const yTo = gsap.quickTo(nodeRef.current, "y", { duration: 0.16, ease: "power3.out" })

    const handlePointerMove = (event: PointerEvent) => {
      if (!enabledRef.current || !nodeRef.current) return

      if (!visibleRef.current) {
        visibleRef.current = true
        gsap.set(nodeRef.current, { autoAlpha: 0.82 })
      }

      const target = event.target instanceof Element
        ? (event.target.closest(MAGNET_SELECTOR) as HTMLElement | null)
        : null

      if (target !== activeTargetRef.current) {
        syncToTargetRef.current(target)
      }

      if (!target) {
        xTo(event.clientX)
        yTo(event.clientY)
      }
    }

    const clearTarget = () => {
      if (!enabledRef.current) return
      activeTargetRef.current = null
      syncToTargetRef.current(null)
      visibleRef.current = false
      if (nodeRef.current) gsap.set(nodeRef.current, { autoAlpha: 0 })
    }

    const syncActiveRect = () => {
      const target = activeTargetRef.current
      if (!enabledRef.current || !target) return
      syncToTargetRef.current(target)
    }

    const bindListeners = () => {
      if (listenersBoundRef.current) return
      listenersBoundRef.current = true
      window.addEventListener("pointermove", handlePointerMove, { passive: true })
      window.addEventListener("pointerleave", clearTarget)
      window.addEventListener("resize", syncActiveRect)
      window.addEventListener("scroll", syncActiveRect, true)
    }

    const unbindListeners = () => {
      if (!listenersBoundRef.current) return
      listenersBoundRef.current = false
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", clearTarget)
      window.removeEventListener("resize", syncActiveRect)
      window.removeEventListener("scroll", syncActiveRect, true)
    }

    const handleModeChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const enabled = event.matches

      if (enabled) {
        bindListeners()
      } else {
        clearTarget()
        unbindListeners()
        gsap.set(nodeRef.current, { autoAlpha: 0 })
      }
    }

    handleModeChange(enabledQuery)
    enabledQuery.addEventListener("change", handleModeChange)

    return () => {
      enabledQuery.removeEventListener("change", handleModeChange)
      unbindListeners()
    }
  }, [])

  return (
    <div ref={shellRef} aria-hidden="true" className="cursor-magnet-shell">
      <div ref={nodeRef} className="cursor-magnet" />
    </div>
  )
}
