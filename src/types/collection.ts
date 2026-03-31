export type CollectionType = "workflow" | "toolkit" | "learning"
export type CollectionItemType = "prompt" | "module"

export interface Collection {
  id: string
  title: string
  description: string
  type: CollectionType
  createdAt: string
  updatedAt: string
  itemCount: number
}

export interface CollectionItem {
  id: string
  collectionId: string
  itemType: CollectionItemType
  promptId: string | null
  moduleId: string | null
  position: number
  createdAt: string
  item: {
    id: string
    title: string
    description?: string
    subtitle?: string
    href: string
  } | null
}
