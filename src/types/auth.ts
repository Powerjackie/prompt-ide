export type AuthRole = "admin" | "member"

export interface AuthSession {
  role: AuthRole
}

export interface AuthzSnapshot {
  isAuthenticated: boolean
  role: AuthRole | null
  canDeleteAssets: boolean
  canManageSettings: boolean
}

export const guestAuthzSnapshot: AuthzSnapshot = {
  isAuthenticated: false,
  role: null,
  canDeleteAssets: false,
  canManageSettings: false,
}

export type AuthActionError = "invalidPassword" | "emptyPassword" | "configError" | null

export interface AuthActionState {
  error: AuthActionError
}

export const initialAuthState: AuthActionState = {
  error: null,
}
