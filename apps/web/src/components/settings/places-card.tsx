import { useQuery } from "@tanstack/react-query"
import { CircleCheck, MapPin } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGeofenceSync } from "@/hooks/use-geofence-sync"
import { labels } from "@/lib/labels"
import { checkPermissions } from "@/lib/places/geofence-plugin"
import { requestBackgroundGeofences } from "@/lib/places/geofence-sync"
import { useTasks } from "@/lib/queries"

const text = labels.places

function BackgroundRequest({ onRequested }: { onRequested: () => void }) {
  const { data: tasks } = useTasks()
  const [pending, setPending] = useState(false)

  const request = async () => {
    setPending(true)
    try {
      await requestBackgroundGeofences(tasks ?? [], new Date())
    } catch (error) {
      toast.error(text.permissionFailed, { description: error instanceof Error ? error.message : String(error) })
    } finally {
      setPending(false)
      onRequested()
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{text.backgroundHint}</p>
      <Button variant="outline" onClick={() => void request()} disabled={pending}>
        <MapPin />
        {text.backgroundPrompt}
      </Button>
    </div>
  )
}

export function PlacesCard() {
  const { registered } = useGeofenceSync()
  const permissions = useQuery({ queryKey: ["geofence-permissions"], queryFn: checkPermissions })
  const granted = permissions.data?.backgroundLocation === "granted"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.settingsTitle}</CardTitle>
        <CardDescription>{text.settingsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {granted ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4" />
            {text.backgroundGranted}
          </p>
        ) : (
          permissions.isSuccess && <BackgroundRequest onRequested={() => void permissions.refetch()} />
        )}
        <p className="text-sm">{text.activeCount(registered)}</p>
      </CardContent>
    </Card>
  )
}
