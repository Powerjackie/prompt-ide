"use client"

import { useRef } from "react"
import { gsap, useGSAP, SplitText } from "@/lib/gsap-config"
import { LoginBackground } from "./login-background"
import { LoginCard } from "./login-card"

export function LoginScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      let titleSplit: SplitText | null = null

      const allTargets = [
        ".gs-login-glow",
        ".gs-login-grid",
        ".gs-login-card",
        ".gs-login-title",
        ".gs-login-desc",
        ".gs-login-field-label",
        ".gs-login-field-input",
        ".gs-login-submit",
      ]

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(allTargets, { clearProps: "all", autoAlpha: 1, x: 0, y: 0, scale: 1 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        titleSplit = new SplitText(".gs-login-title", { type: "words,lines" })

        gsap.set(".gs-login-glow", { autoAlpha: 0, scale: 0.8 })
        gsap.set(".gs-login-grid", { autoAlpha: 0 })
        gsap.set(".gs-login-card", { autoAlpha: 0, y: 40, scale: 0.95 })
        gsap.set(".gs-login-title", { autoAlpha: 1 })
        gsap.set(titleSplit.words, {
          autoAlpha: 0,
          y: 28,
          rotateX: -85,
          transformOrigin: "0% 100%",
        })
        gsap.set(".gs-login-desc", { autoAlpha: 0, y: 16 })
        gsap.set(".gs-login-field-label", { autoAlpha: 0, y: 12 })
        gsap.set(".gs-login-field-input", { autoAlpha: 0, y: 12 })
        gsap.set(".gs-login-submit", { autoAlpha: 0, y: 12, scale: 0.96 })

        const tl = gsap.timeline({ defaults: { ease: "power2.out" } })

        tl.to(".gs-login-glow", { autoAlpha: 1, scale: 1, duration: 0.6 })
          .to(".gs-login-grid", { autoAlpha: 1, duration: 0.5 }, "-=0.3")
          .to(".gs-login-card", { autoAlpha: 1, y: 0, scale: 1, duration: 0.5 }, "-=0.2")
          .to(
            titleSplit.words,
            {
              autoAlpha: 1,
              y: 0,
              rotateX: 0,
              duration: 0.58,
              stagger: 0.05,
            },
            "-=0.15"
          )
          .to(".gs-login-desc", { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.3")
          .to(".gs-login-field-label", { autoAlpha: 1, y: 0, duration: 0.28 }, "-=0.18")
          .to(".gs-login-field-input", { autoAlpha: 1, y: 0, duration: 0.28 }, "-=0.12")
          .to(".gs-login-submit", { autoAlpha: 1, y: 0, scale: 1, duration: 0.3 }, "-=0.1")
          .eventCallback("onComplete", () => {
            gsap.set(
              ".gs-login-glow, .gs-login-grid, .gs-login-card, .gs-login-desc, .gs-login-field-label, .gs-login-field-input, .gs-login-submit",
              { clearProps: "opacity,transform" }
            )
            gsap.set(titleSplit?.words ?? [], { clearProps: "opacity,transform" })
          })

        return () => {
          tl.kill()
        }
      })

      return () => {
        titleSplit?.revert()
        mm.revert()
      }
    },
    { scope: containerRef }
  )

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-8"
    >
      <LoginBackground />
      <div className="relative z-10">
        <LoginCard />
      </div>
    </div>
  )
}
