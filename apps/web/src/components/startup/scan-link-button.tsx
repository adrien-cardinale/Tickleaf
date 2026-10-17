import { checkPermissions, Format, openAppSettings, requestPermissions, scan } from "@tauri-apps/plugin-barcode-scanner"
import { ScanLine } from "lucide-react"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { parseDeviceLink } from "@/lib/crypto/device-link"
import { completeOnboarding } from "@/lib/crypto/onboarding"
import { labels } from "@/lib/labels"

const text = labels.onboarding.scan

type CameraAccess = "granted" | "refused" | "blocked"

async function requestCameraAccess(): Promise<CameraAccess> {
  const state = await checkPermissions()
  if (state === "granted") return "granted"
  if (state === "denied") return "blocked"
  return (await requestPermissions()) === "granted" ? "granted" : "refused"
}

function showScanError(error: unknown) {
  const detail = error instanceof Error ? error.message : typeof error === "string" ? error : ""
  toast.error(text.failed, detail === "" ? undefined : { description: detail })
}

export function ScanLinkButton({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState(false)
  const [settingsPromptOpen, setSettingsPromptOpen] = useState(false)

  const scanLink = async () => {
    const scanned = await scan({ formats: [Format.QRCode], cameraDirection: "back" })
    const link = await parseDeviceLink(scanned.content)
    await completeOnboarding({ key: link.key, created: false, serverUrl: link.serverUrl })
    onDone()
  }

  const run = async () => {
    setPending(true)
    try {
      const access = await requestCameraAccess()
      if (access === "blocked") return setSettingsPromptOpen(true)
      if (access === "refused") return void toast.error(text.cameraDenied)
      await scanLink()
    } catch (error) {
      showScanError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button onClick={() => void run()} disabled={pending}>
        <ScanLine />
        {pending ? text.scanning : text.action}
      </Button>
      <AlertDialog open={settingsPromptOpen} onOpenChange={setSettingsPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{text.settingsTitle}</AlertDialogTitle>
            <AlertDialogDescription>{text.settingsDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.settings.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void openAppSettings()}>{text.openSettings}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
