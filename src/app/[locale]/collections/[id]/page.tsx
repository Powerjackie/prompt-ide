"use client"

import { use, useEffect, useMemo, useState, useTransition } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, LibraryBig, Plus, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthz } from "@/components/auth/authz-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CollectionFormDialog } from "@/components/collections/collection-form-dialog"
import {
  addCollectionItem,
  deleteCollection,
  getCollectionById,
  removeCollectionItem,
} from "@/app/actions/collection.actions"
import { getPrompts, type SerializedPrompt } from "@/app/actions/prompt.actions"
import { getModules, type SerializedModule } from "@/app/actions/module.actions"
import { cn, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Collection, CollectionItem, CollectionItemType } from "@/types/collection"

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations("collections")
  const tc = useTranslations("common")
  const { canDeleteAssets } = useAuthz()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [items, setItems] = useState<CollectionItem[]>([])
  const [prompts, setPrompts] = useState<SerializedPrompt[]>([])
  const [modules, setModules] = useState<SerializedModule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [itemType, setItemType] = useState<CollectionItemType>("prompt")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      setLoading(true)
      const [collectionResult, promptResult, moduleResult] = await Promise.all([
        getCollectionById(id),
        getPrompts(),
        getModules(),
      ])

      if (cancelled) return

      if (collectionResult.success) {
        setCollection(collectionResult.data.collection)
        setItems(collectionResult.data.items)
      } else {
        setCollection(null)
        toast.error(collectionResult.error)
      }

      if (promptResult.success) {
        setPrompts(promptResult.data.filter((prompt) => prompt.status !== "archived"))
      }

      if (moduleResult.success) {
        setModules(moduleResult.data)
      }

      setLoading(false)
    }

    void loadDetail()

    return () => {
      cancelled = true
    }
  }, [id])

  const availableOptions = useMemo(
    () =>
      itemType === "prompt"
        ? prompts.map((prompt) => ({
            id: prompt.id,
            label: prompt.title,
            meta: prompt.description,
          }))
        : modules.map((module) => ({
            id: module.id,
            label: module.title,
            meta: module.type,
          })),
    [itemType, modules, prompts]
  )

  const handleAddItem = () => {
    if (!selectedItemId) {
      toast.error(t("selectItem"))
      return
    }

    startTransition(async () => {
      const result = await addCollectionItem({
        collectionId: id,
        itemType,
        itemId: selectedItemId,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      setItems((current) => [...current, result.data].sort((left, right) => left.position - right.position))
      setCollection((current) =>
        current
          ? {
              ...current,
              itemCount: current.itemCount + 1,
            }
          : current
      )
      setSelectedItemId("")
      toast.success(t("itemAdded"))
    })
  }

  const handleRemoveItem = (collectionItemId: string) => {
    startTransition(async () => {
      const result = await removeCollectionItem(collectionItemId)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setItems((current) => current.filter((item) => item.id !== collectionItemId))
      setCollection((current) =>
        current
          ? {
              ...current,
              itemCount: Math.max(0, current.itemCount - 1),
            }
          : current
      )
      toast.success(t("itemRemoved"))
    })
  }

  const handleDeleteCollection = () => {
    startTransition(async () => {
      const result = await deleteCollection(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(t("deleted"))
      router.push("/collections")
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>{t("notFound")}</p>
        <Button variant="link" asChild>
          <Link href="/collections">{tc("back")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", pending && "pointer-events-none opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/collections">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {tc("back")}
            </Link>
          </Button>
          <LibraryBig className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold">{collection.title}</h1>
            <p className="text-sm text-muted-foreground">
              {collection.description || t("noDescription")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{t(`types.${collection.type}`)}</Badge>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Pencil className="mr-1 h-4 w-4" />
            {tc("edit")}
          </Button>
          {canDeleteAssets ? (
            <AlertDialog>
              <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>
                <Trash2 className="mr-1 h-4 w-4" />
                {tc("delete")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteCollection}>
                    {tc("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("itemsTitle")}</CardTitle>
              <Badge variant="secondary">{t("itemCount", { count: collection.itemCount })}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("emptyItems")}</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{t(`itemTypes.${item.itemType}`)}</Badge>
                      <Link className="font-medium hover:underline" href={item.item?.href ?? "/collections"}>
                        {item.item?.title ?? t("missingItem")}
                      </Link>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.item?.description ?? item.item?.subtitle ?? t("noDescription")}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("itemPosition", { position: item.position })} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  {canDeleteAssets ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      {tc("delete")}
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("addItemTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="text-sm font-medium">{t("itemTypeLabel")}</div>
              <Select
                value={itemType}
                onValueChange={(value) => {
                  setItemType(value as CollectionItemType)
                  setSelectedItemId("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prompt">{t("itemTypes.prompt")}</SelectItem>
                  <SelectItem value="module">{t("itemTypes.module")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-medium">{t("itemLabel")}</div>
              <Select
                value={selectedItemId}
                onValueChange={(value) => setSelectedItemId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedItemId && (
                <p className="text-sm text-muted-foreground">
                  {availableOptions.find((option) => option.id === selectedItemId)?.meta || t("noDescription")}
                </p>
              )}
            </div>

            <Button className="w-full" onClick={handleAddItem} disabled={pending}>
              <Plus className="mr-1 h-4 w-4" />
              {t("addItemAction")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <CollectionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialCollection={collection}
        onSaved={(updatedCollection) => setCollection(updatedCollection)}
      />
    </div>
  )
}
