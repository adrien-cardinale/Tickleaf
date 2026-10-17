import {
  cancel,
  isPermissionGranted,
  pending,
  requestPermission,
  Schedule,
  sendNotification,
} from "@tauri-apps/plugin-notification"
import { isAndroid, isTauri } from "@/lib/runtime"
import { type Reminder, reminderSignature } from "./reminder-plan"

const MAX_TIMER_DELAY_MS = 2 ** 31 - 1

const scheduledSignatures = new Map<number, string>()
const desktopTimers = new Map<number, ReturnType<typeof setTimeout>>()

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isTauri()) return false
  if (await isPermissionGranted()) return true
  return (await requestPermission()) === "granted"
}

function isScheduled(reminder: Reminder): boolean {
  return scheduledSignatures.get(reminder.id) === reminderSignature(reminder)
}

async function scheduleOnAndroid(reminders: readonly Reminder[]): Promise<void> {
  const wanted = new Set(reminders.map((reminder) => reminder.id))
  const stale = (await pending()).map((notification) => notification.id).filter((id) => !wanted.has(id))
  if (stale.length > 0) await cancel(stale)
  for (const id of stale) scheduledSignatures.delete(id)
  for (const reminder of reminders) {
    if (isScheduled(reminder)) continue
    sendNotification({
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      schedule: Schedule.at(reminder.at, false, true),
    })
    scheduledSignatures.set(reminder.id, reminderSignature(reminder))
  }
}

function clearDesktopTimer(id: number): void {
  clearTimeout(desktopTimers.get(id))
  desktopTimers.delete(id)
  scheduledSignatures.delete(id)
}

function scheduleOnDesktop(reminders: readonly Reminder[], now: Date): void {
  const wanted = new Set(reminders.map((reminder) => reminder.id))
  for (const id of desktopTimers.keys()) if (!wanted.has(id)) clearDesktopTimer(id)
  for (const reminder of reminders) {
    if (isScheduled(reminder)) continue
    const delay = reminder.at.getTime() - now.getTime()
    if (delay > MAX_TIMER_DELAY_MS) continue
    clearDesktopTimer(reminder.id)
    const timer = setTimeout(() => {
      clearDesktopTimer(reminder.id)
      sendNotification({ title: reminder.title, body: reminder.body })
    }, delay)
    desktopTimers.set(reminder.id, timer)
    scheduledSignatures.set(reminder.id, reminderSignature(reminder))
  }
}

export async function scheduleReminders(reminders: readonly Reminder[], now: Date): Promise<void> {
  if (!isTauri() || !(await isPermissionGranted())) return
  if (isAndroid()) await scheduleOnAndroid(reminders)
  else scheduleOnDesktop(reminders, now)
}
