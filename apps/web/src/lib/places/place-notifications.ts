import { sendNotification } from "@tauri-apps/plugin-notification"
import type { Position } from "@tickleaf/core"
import { ensureNotificationPermission } from "@/lib/reminders/reminder-notifications"
import { checkArrivals, type GeofenceTarget } from "./place-plan"

let tasksInside: ReadonlySet<string> = new Set()

export async function notifyArrivals(targets: readonly GeofenceTarget[], position: Position): Promise<void> {
  const { arrivals, inside } = checkArrivals(targets, position, tasksInside)
  tasksInside = inside
  if (arrivals.length === 0 || !(await ensureNotificationPermission())) return
  for (const target of arrivals) sendNotification({ title: target.title, body: target.body })
}
