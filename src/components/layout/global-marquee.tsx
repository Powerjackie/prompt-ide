"use client"

import { useMemo, useRef } from "react"
import { gsap, useGSAP } from "@/lib/gsap-config"

const MARQUEE_ITEMS = [
  "PROMPT OPERATIONS",
  "STATELESS ANALYSIS",
  "VERSION SNAPSHOTS",
  "MODULE ROUTING",
  "LOCAL FLIP",
  "GLOBAL MOTION",
] as const

export function GlobalMarquee() {
  const shellRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => [...MARQUEE_ITEMS, ...MARQUEE_ITEMS], [])

  useGSAP(
    () => {
      if (!trackRef.current) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          normal: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.reduced) {
            gsap.set(trackRef.current, { clearProps: "transform" })
            return
          }

          gsap.to(trackRef.current, {
            xPercent: -50,
            duration: 24,
            ease: "none",
            repeat: -1,
          })
        }
      )

      return () => {
        mm.revert()
      }
    },
    { scope: shellRef }
  )

  return (
    <div ref={shellRef} className="global-marquee" aria-label="Global ambient strip">
      <div ref={trackRef} className="global-marquee__track">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="global-marquee__item">
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
