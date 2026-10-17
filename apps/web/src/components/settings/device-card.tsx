import { DeleteServerAccountButton } from "@/components/sync/delete-server-account-button"
import { ForgetDeviceButton } from "@/components/sync/forget-device-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { labels } from "@/lib/labels"

type DeviceCardProps = { pendingCount: number; syncConfigured: boolean }

export function DeviceCard({ pendingCount, syncConfigured }: DeviceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.settings.device.title}</CardTitle>
        <CardDescription>{labels.settings.device.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-2 sm:flex-row">
        <ForgetDeviceButton pendingCount={pendingCount} />
        {syncConfigured && <DeleteServerAccountButton />}
      </CardContent>
    </Card>
  )
}
