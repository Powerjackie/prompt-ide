"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-0 dark:focus-visible:outline-none dark:focus-visible:[box-shadow:0_0_0_1px_rgba(79,246,255,0.34),0_0_0_3px_rgba(79,246,255,0.14),0_0_24px_-8px_rgba(79,246,255,0.96),0_0_34px_-12px_rgba(106,124,255,0.72),0_0_42px_-16px_rgba(255,79,216,0.54)] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 dark:bg-[linear-gradient(135deg,rgba(79,246,255,1),rgba(106,124,255,0.86))] dark:text-[#061118] dark:shadow-[0_20px_52px_-20px_rgba(79,246,255,0.62),0_0_28px_-14px_rgba(255,79,216,0.34)] dark:hover:bg-[linear-gradient(135deg,rgba(110,249,255,1),rgba(122,133,255,0.96))] dark:hover:shadow-[0_0_0_1px_rgba(79,246,255,0.22),0_0_0_3px_rgba(79,246,255,0.08),0_24px_58px_-18px_rgba(79,246,255,0.78),0_0_34px_-12px_rgba(255,79,216,0.42)] dark:active:shadow-[0_0_0_1px_rgba(79,246,255,0.28),0_0_0_2px_rgba(79,246,255,0.1),0_0_22px_-10px_rgba(79,246,255,0.7),0_0_26px_-14px_rgba(255,79,216,0.34)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-primary/18 dark:bg-[linear-gradient(180deg,rgba(17,22,37,0.96),rgba(21,27,46,0.88))] dark:hover:border-primary/34 dark:hover:bg-[linear-gradient(180deg,rgba(18,30,49,0.98),rgba(22,38,61,0.94))] dark:hover:text-primary dark:hover:[box-shadow:0_0_0_1px_rgba(79,246,255,0.18),0_0_0_3px_rgba(79,246,255,0.05),0_0_20px_-12px_rgba(79,246,255,0.7),0_0_28px_-16px_rgba(255,79,216,0.28)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 dark:bg-[linear-gradient(180deg,rgba(21,27,46,0.96),rgba(15,21,36,0.92))] dark:hover:bg-[linear-gradient(180deg,rgba(23,35,57,0.98),rgba(16,25,41,0.94))] dark:hover:[box-shadow:0_0_0_1px_rgba(79,246,255,0.14),0_0_0_3px_rgba(79,246,255,0.04),0_0_18px_-12px_rgba(79,246,255,0.46),0_0_24px_-16px_rgba(255,79,216,0.2)]",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-primary/12 dark:hover:text-primary dark:hover:[box-shadow:0_0_0_1px_rgba(79,246,255,0.14),0_0_0_3px_rgba(79,246,255,0.04),0_0_18px_-12px_rgba(79,246,255,0.46),0_0_24px_-16px_rgba(255,79,216,0.2)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
