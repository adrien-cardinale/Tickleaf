import { DeviceLinkSection } from "@/components/sync/device-link-section"
import { RecoveryKeySection } from "@/components/sync/recovery-key-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { labels } from "@/lib/labels"
import { isAndroid } from "@/lib/runtime"

export function RecoveryKeyCard({ serverUrl }: { serverUrl: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.settings.recoveryKey.title}</CardTitle>
        <CardDescription>{labels.settings.recoveryKey.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <RecoveryKeySection />
        {!isAndroid() && <DeviceLinkSection serverUrl={serverUrl} />}
      </CardContent>
    </Card>
  )
}
