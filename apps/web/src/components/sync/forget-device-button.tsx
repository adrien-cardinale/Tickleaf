import { LogOut } from "lucide-react"
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
import { removeAccountFromDevice } from "@/lib/account/account-actions"
import { labels } from "@/lib/labels"

export function ForgetDeviceButton({ pendingCount }: { pendingCount: number }) {
  const [pending, setPending] = useState(false)

  const forget = async () => {
    setPending(true)
    try {
      await removeAccountFromDevice()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.boot.unexpected)
      setPending(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive">
          <LogOut />
          {labels.settings.device.forget}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.settings.device.forgetTitle}</AlertDialogTitle>
          <AlertDialogDescription>{labels.settings.device.forgetDescription(pendingCount)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{labels.settings.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={() => void forget()}>
            {labels.settings.device.forgetConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
