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
      <div className="gs-login-field-label space-y-2">
        <Label htmlFor="password" className="text-white/82">
          {label}
        </Label>
      </div>
      <div className="gs-login-field-input relative">
        <Input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="current-password"
          required
          className="h-12 rounded-2xl border-white/8 bg-white/[0.03] text-white placeholder:text-white/35 pr-11"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </>
  )
}
