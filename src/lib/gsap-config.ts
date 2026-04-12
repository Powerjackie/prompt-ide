import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Draggable } from "gsap/dist/Draggable"
import { Flip } from "gsap/dist/Flip"
import { Observer } from "gsap/dist/Observer"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { SplitText } from "gsap/dist/SplitText"

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip, Draggable, Observer, SplitText)

gsap.defaults({
  duration: 0.5,
  ease: "power2.out",
})

if (typeof window !== "undefined") {
  // @ts-expect-error — Level 2 verification probe only
  window.__GSAP__ = { gsap, ScrollTrigger, Flip, Draggable, Observer, SplitText }
}

export { gsap, useGSAP, ScrollTrigger, Flip, Draggable, Observer, SplitText }
