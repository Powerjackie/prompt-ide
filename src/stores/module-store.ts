import { create } from "zustand"

interface ModuleUIStore {
  activeFilter: string
  setActiveFilter: (filter: string) => void
}

export const useModuleUIStore = create<ModuleUIStore>()((set) => ({
  activeFilter: "all",
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}))
