import { create } from "zustand"

/**
 * Prompt UI Store — pure client-side UI state only.
 * All data CRUD is handled by server actions in src/app/actions/prompt.actions.ts.
 * This store only tracks ephemeral UI state (filters, view preferences, etc.).
 */
interface PromptUIStore {
  /** Currently selected tag filter in prompts list */
  activeTag: string | null
  setActiveTag: (tag: string | null) => void
}

export const usePromptUIStore = create<PromptUIStore>()((set) => ({
  activeTag: null,
  setActiveTag: (tag) => set({ activeTag: tag }),
}))
