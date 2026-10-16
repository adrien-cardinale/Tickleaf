import { ForgetDeviceButton } from "@/components/sync/forget-device-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { labels } from "@/lib/labels"

export function DeviceCard({ pendingCount }: { pendingCount: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.settings.device.title}</CardTitle>
        <CardDescription>{labels.settings.device.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgetDeviceButton pendingCount={pendingCount} />
      </CardContent>
    </Card>
  )
}
