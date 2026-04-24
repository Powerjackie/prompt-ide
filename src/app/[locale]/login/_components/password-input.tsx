"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PasswordInputProps {
  label: string
  placeholder: string
}

export function PasswordInput({ label, placeholder }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <input
        type="text"
        name="username"
        autoComplete="username"
        value="prompt-ide"
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <div className="space-y-2">
        <Label htmlFor="password">{label}</Label>
      </div>
      <div className="relative">
        <Input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="current-password"
          required
          className="h-12 rounded-[var(--radius-sm)] border-border bg-background pr-11"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </>
  )
}
