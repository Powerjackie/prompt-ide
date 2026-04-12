"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface AdminResetDialogProps {
  pending: boolean
  onConfirm: () => void
}

export function AdminResetDialog({ pending, onConfirm }: AdminResetDialogProps) {
  const t = useTranslations("adminConsole")

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            id="admin-reset-trigger"
            type="button"
            variant="destructive"
            className="rounded-none border-2 border-destructive px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]"
          />
        }
      >
        <RotateCcw className="h-4 w-4" />
        {pending ? t("danger.pending") : t("danger.action")}
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-none border-2 border-border bg-card shadow-[8px_8px_0_0_var(--border)]">
        <AlertDialogHeader>
          <AlertDialogMedia className="rounded-none bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </AlertDialogMedia>
          <AlertDialogTitle className="font-mono text-sm font-black uppercase tracking-[0.14em]">
            {t("resetDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-7">
            {t("resetDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="rounded-none border-t-2 border-border bg-muted/30">
          <AlertDialogCancel className="rounded-none border-2 border-border font-mono text-xs uppercase tracking-[0.16em]">
            {t("resetDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            id="admin-reset-confirm"
            onClick={onConfirm}
            className="rounded-none border-2 border-destructive font-mono text-xs uppercase tracking-[0.16em]"
          >
            {t("resetDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
