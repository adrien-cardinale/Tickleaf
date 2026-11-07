import { toast } from "sonner"
import { labels } from "@/lib/labels"
import type { PositionReading } from "./position"

export function warnPositionFailure(reading: PositionReading): void {
  if (reading.status === "denied") {
    toast.error(labels.places.permissionDenied, { description: labels.places.permissionHint })
  } else if (reading.status === "unavailable") {
    toast.error(labels.places.unavailable, { description: labels.places.unavailableHint })
  }
}
