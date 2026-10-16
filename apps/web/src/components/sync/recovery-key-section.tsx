import { EyeOff, KeyRound } from "lucide-react"
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
import { formatMasterKey } from "@/lib/crypto/master-key"
import { readRecoveryKey } from "@/lib/crypto/onboarding"
import { labels } from "@/lib/labels"
import { RecoveryKey } from "./recovery-key"

export function RecoveryKeySection() {
  const [phrase, setPhrase] = useState<string | null>(null)

  const reveal = async () => {
    try {
      setPhrase(await formatMasterKey(await readRecoveryKey()))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.boot.unexpected)
    }
  }

  if (phrase !== null) {
    return (
      <div className="space-y-2">
        <RecoveryKey phrase={phrase} />
        <Button variant="ghost" className="w-full" onClick={() => setPhrase(null)}>
          <EyeOff />
          {labels.sync.dialog.hideKey}
        </Button>
      </div>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <KeyRound />
          {labels.sync.dialog.showKey}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.sync.dialog.keyWarningTitle}</AlertDialogTitle>
          <AlertDialogDescription>{labels.sync.dialog.keyWarning}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{labels.sync.dialog.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void reveal()}>{labels.sync.dialog.reveal}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
