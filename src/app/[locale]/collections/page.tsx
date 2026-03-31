"use client"

import { useEffect, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { LibraryBig, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionFormDialog } from "@/components/collections/collection-form-dialog"
import { getCollections } from "@/app/actions/collection.actions"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Collection } from "@/types/collection"

export default function CollectionsPage() {
  const t = useTranslations("collections")
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCollections() {
      setLoading(true)
      const result = await getCollections()
      if (cancelled) return

      if (result.success) {
        setCollections(result.data)
      } else {
        toast.error(result.error)
      }
      setLoading(false)
    }

    void loadCollections()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LibraryBig className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Badge variant="secondary">{collections.length}</Badge>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("newCollection")}
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <LibraryBig className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40 hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{collection.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {collection.description || t("noDescription")}
                      </p>
                    </div>
                    <Badge variant="outline">{t(`types.${collection.type}`)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t("itemCount", { count: collection.itemCount })}</span>
                  <span>{formatDate(collection.updatedAt)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CollectionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(collection) => setCollections((current) => [collection, ...current])}
      />
    </div>
  )
}
