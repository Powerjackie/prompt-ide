import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const brutalCardVariants = cva("border-[color:var(--border)] bg-card", {
  variants: {
    border: {
      default: "brutal-border",
      thick: "brutal-border-thick",
      none: "",
    },
    shadow: {
      none: "",
      sm: "brutal-shadow-sm",
      default: "brutal-shadow",
      lg: "brutal-shadow-lg",
      xl: "brutal-shadow-xl",
    },
    hover: {
      none: "",
      shift:
        "transition-transform duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
    },
    padding: {
      none: "",
      sm: "p-4",
      default: "p-5",
      lg: "p-6 sm:p-8",
      xl: "p-6 sm:p-8 lg:p-10",
    },
  },
  defaultVariants: {
    border: "default",
    shadow: "default",
    hover: "none",
    padding: "default",
  },
})

interface BrutalCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof brutalCardVariants> {
  as?: "div" | "section" | "article" | "aside" | "footer"
}

function BrutalCard({
  className,
  border,
  shadow,
  hover,
  padding,
  as: Comp = "div",
  ...props
}: BrutalCardProps) {
  return (
    <Comp
      className={cn(brutalCardVariants({ border, shadow, hover, padding }), className)}
      {...props}
    />
  )
}

export { BrutalCard, brutalCardVariants }
