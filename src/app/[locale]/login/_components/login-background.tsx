"use client"

import { useRef } from "react"
import { gsap, useGSAP } from "@/lib/gsap-config"

export function LoginBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowARef = useRef<HTMLDivElement>(null)
  const glowBRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".gs-login-glow, .gs-login-grid", { clearProps: "all", autoAlpha: 1 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const driftA = gsap.to(glowARef.current, {
          x: "+=120",
          y: "+=80",
          duration: 10,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        })

        const pulseA = gsap.to(glowARef.current, {
          scale: 1.2,
          duration: 14,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        })

        const driftB = gsap.to(glowBRef.current, {
          x: "-=90",
          y: "+=100",
          duration: 12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        })

        const pulseB = gsap.to(glowBRef.current, {
          scale: 1.15,
          duration: 16,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        })

        const gridBreath = gsap.to(".gs-login-grid", {
          opacity: 0.6,
          duration: 6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        })

        return () => {
          driftA.kill()
          pulseA.kill()
          driftB.kill()
          pulseB.kill()
          gridBreath.kill()
        }
      })

      return () => {
        mm.revert()
      }
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className="gs-login-grid absolute inset-0 login-dot-grid" />
      <div
        ref={glowARef}
        className="gs-login-glow login-glow login-glow--a absolute"
      />
      <div
        ref={glowBRef}
        className="gs-login-glow login-glow login-glow--b absolute"
      />
    </div>
  )
}
