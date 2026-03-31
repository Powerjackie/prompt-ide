export type AuthActionError = "invalidPassword" | "configError" | null

export interface AuthActionState {
  error: AuthActionError
}

export const initialAuthState: AuthActionState = {
  error: null,
}
