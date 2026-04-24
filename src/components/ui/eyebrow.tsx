import * as React from "react"

import { cn } from "@/lib/utils"

export function Eyebrow({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("eyebrow", className)} {...props} />
}
