"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import enMessages from "../../messages/en.json"
import zhMessages from "../../messages/zh.json"

export default function RootNotFound() {
  const pathname = usePathname()
  const locale = pathname?.startsWith("/en") ? "en" : "zh"
  const messages = locale === "en" ? enMessages.notFound : zhMessages.notFound

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
      <div className="app-panel w-full max-w-2xl p-8 text-center sm:p-10">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            404
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{messages.title}</h1>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
            {messages.description}
          </p>
          <Button asChild className="mt-2 rounded-2xl">
            <Link href={locale === "en" ? "/en" : "/zh"}>{messages.backHome}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
