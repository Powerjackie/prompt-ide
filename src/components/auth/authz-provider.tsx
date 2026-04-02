"use client"

import * as React from "react"
import type { AuthzSnapshot } from "@/types/auth"

const AuthzContext = React.createContext<AuthzSnapshot | undefined>(undefined)

export function AuthzProvider({
  children,
  initialAuthz,
}: {
  children: React.ReactNode
  initialAuthz: AuthzSnapshot
}) {
  return <AuthzContext.Provider value={initialAuthz}>{children}</AuthzContext.Provider>
}

export function useAuthz() {
  const context = React.useContext(AuthzContext)

  if (!context) {
    throw new Error("useAuthz must be used within AuthzProvider")
  }

  return context
}
