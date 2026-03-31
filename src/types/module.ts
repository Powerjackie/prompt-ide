export type ModuleType =
  | "role"
  | "goal"
  | "constraint"
  | "output_format"
  | "style"
  | "self_check"

export interface Module {
  id: string
  title: string
  type: ModuleType
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}
