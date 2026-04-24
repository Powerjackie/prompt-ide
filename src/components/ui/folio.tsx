import * as React from "react"

import { cn } from "@/lib/utils"

export function Folio({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("folio", className)} {...props} />
}
