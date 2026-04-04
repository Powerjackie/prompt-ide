import type { ReactNode } from "react"
import { AlertTriangle, Info, Lightbulb } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"

interface CalloutProps {
  type?: "tip" | "note" | "warning"
  children: ReactNode
}

const CALLOUT_STYLES = {
  tip: {
    icon: Lightbulb,
    container:
      "border-emerald-500/25 bg-emerald-500/8 text-foreground dark:border-emerald-300/20 dark:bg-emerald-400/8",
    iconWrap:
      "bg-emerald-500/14 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200",
  },
  note: {
    icon: Info,
    container:
      "border-sky-500/25 bg-sky-500/8 text-foreground dark:border-sky-300/20 dark:bg-sky-400/8",
    iconWrap: "bg-sky-500/14 text-sky-700 dark:bg-sky-300/12 dark:text-sky-200",
  },
  warning: {
    icon: AlertTriangle,
    container:
      "border-amber-500/30 bg-amber-500/10 text-foreground dark:border-amber-300/24 dark:bg-amber-400/10",
    iconWrap:
      "bg-amber-500/16 text-amber-700 dark:bg-amber-300/12 dark:text-amber-200",
  },
} as const

export async function Callout({ type = "note", children }: CalloutProps) {
  const t = await getTranslations("docs.callout")
  const styles = CALLOUT_STYLES[type]
  const Icon = styles.icon

  return (
    <aside
      className={cn(
        "my-6 rounded-[1.5rem] border p-4 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.34)] backdrop-blur-xl",
        styles.container
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", styles.iconWrap)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t(type)}
          </div>
          <div className="mt-2 text-sm leading-6 text-foreground/90">{children}</div>
        </div>
      </div>
    </aside>
  )
}
