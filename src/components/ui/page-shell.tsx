import * as React from "react"

import { cn } from "@/lib/utils"

type PageShellProps = React.ComponentProps<"section"> & {
  width?: "default" | "narrow" | "wide"
}

const widthClass = {
  default: "max-w-[1280px]",
  narrow: "max-w-[1040px]",
  wide: "max-w-[1440px]",
}

export function PageShell({
  className,
  width = "default",
  ...props
}: PageShellProps) {
  return (
    <section
      className={cn("lab-page mx-auto w-full", widthClass[width], className)}
      {...props}
    />
  )
}
