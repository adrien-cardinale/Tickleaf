import type { Task } from "@tickleaf/core"
import { labels } from "@/lib/labels"

export type Reminder = { id: number; title: string; body: string; at: Date }

const NOTIFICATION_ID_RANGE = 2 ** 31

export function notificationId(taskId: string): number {
  let hash = 0
  for (const char of taskId) hash = (hash * 31 + char.charCodeAt(0)) % NOTIFICATION_ID_RANGE
  return hash
}

export function upcomingReminders(tasks: readonly Task[], now: Date): Reminder[] {
  return tasks.flatMap((task) => {
    if (task.completedAt !== null || task.reminderAt === null) return []
    const at = new Date(task.reminderAt)
    if (at <= now) return []
    const body = task.description.trim() || labels.reminders.body
    return [{ id: notificationId(task.id), title: task.title, body, at }]
  })
}

export function reminderSignature(reminder: Reminder): string {
  return `${reminder.at.toISOString()}|${reminder.title}|${reminder.body}`
}
