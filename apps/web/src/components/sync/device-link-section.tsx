import { EyeOff, QrCode, TriangleAlert } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { buildDeviceLink } from "@/lib/crypto/device-link"
import { readRecoveryKey } from "@/lib/crypto/onboarding"
import { labels } from "@/lib/labels"

const text = labels.settings.deviceLink

function absoluteServerUrl(serverUrl: string | null): string | null {
  if (serverUrl === null) return null
  return serverUrl === "" ? window.location.origin : serverUrl
}

export function DeviceLinkSection({ serverUrl }: { serverUrl: string | null }) {
  const [link, setLink] = useState<string | null>(null)
  const absoluteUrl = absoluteServerUrl(serverUrl)

  const toggle = async () => {
    if (link !== null) return setLink(null)
    try {
      setLink(await buildDeviceLink(await readRecoveryKey(), absoluteUrl))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.buildFailed)
    }
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={() => void toggle()}>
        {link === null ? <QrCode /> : <EyeOff />}
        {link === null ? text.show : text.hide}
      </Button>
      {link !== null && (
        <div className="space-y-3">
          {absoluteUrl === null && (
            <Alert>
              <TriangleAlert />
              <AlertTitle>{text.noServerTitle}</AlertTitle>
              <AlertDescription>{text.noServerDescription}</AlertDescription>
            </Alert>
          )}
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{text.secretTitle}</AlertTitle>
            <AlertDescription>{text.secretDescription}</AlertDescription>
          </Alert>
          {/* Fond blanc et modules noirs en dur : un scanner lit mal un QR code aux couleurs du thème sombre. */}
          <div className="w-full max-w-72 rounded-md border bg-white p-3">
            <QRCodeSVG
              value={link}
              size={256}
              level="M"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#000000"
              className="block h-auto w-full"
            />
          </div>
          <p className="text-sm text-muted-foreground">{text.steps}</p>
        </div>
      )}
    </div>
  )
}
