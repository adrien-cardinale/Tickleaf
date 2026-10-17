import { Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { deleteAccountEverywhere } from "@/lib/account/account-actions"
import { labels } from "@/lib/labels"

const text = labels.settings.device

export function DeleteServerAccountButton() {
  const [pending, setPending] = useState(false)

  const remove = async () => {
    setPending(true)
    try {
      await deleteAccountEverywhere()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.boot.unexpected)
      setPending(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 />
          {text.deleteServer}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{text.deleteServerTitle}</AlertDialogTitle>
          <AlertDialogDescription>{text.deleteServerDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{labels.settings.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={() => void remove()}>
            {text.deleteServerConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
