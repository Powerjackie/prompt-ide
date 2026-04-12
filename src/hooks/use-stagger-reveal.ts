"use client"

import { useRef } from "react"
import { gsap, useGSAP } from "@/lib/gsap-config"

type StaggerRevealOptions = {
  delay?: number
  stagger?: number
  y?: number
}

export function useStaggerReveal(
  selector: string,
  options?: StaggerRevealOptions,
  dependencies: readonly unknown[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const container = containerRef.current
      if (!container) return

      const mm = gsap.matchMedia()

      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          noPreference: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const targets = container.querySelectorAll(selector)
          if (!targets.length) return

          if (context.conditions?.reduce) {
            gsap.set(targets, {
              autoAlpha: 1,
              y: 0,
              clearProps: "opacity,transform",
            })
            return
          }

          gsap.set(targets, {
            autoAlpha: 0,
            y: options?.y ?? 20,
          })

          const tween = gsap.to(targets, {
            autoAlpha: 1,
            y: 0,
            delay: options?.delay ?? 0.1,
            stagger: options?.stagger ?? 0.08,
            clearProps: "opacity,transform",
          })

          return () => {
            tween.kill()
          }
        }
      )

      return () => {
        mm.revert()
      }
    },
    {
      scope: containerRef,
      dependencies: [selector, options?.delay, options?.stagger, options?.y, ...dependencies],
    }
  )

  return containerRef
}
