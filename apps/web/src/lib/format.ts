import {
  addDays,
  type DatedTask,
  fromIsoDate,
  type IsoDate,
  localDueTime,
  type Place,
  type Recurrence,
  type Task,
} from "@tickleaf/core"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { labels } from "@/lib/labels"

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatLongDate(value: IsoDate): string {
  return format(fromIsoDate(value), "EEEE d MMMM", { locale: fr })
}

export function formatShortDate(value: IsoDate): string {
  return format(fromIsoDate(value), "EEE d MMM", { locale: fr })
}

export function formatTimestamp(timestamp: string): string {
  return format(new Date(timestamp), "EEE d MMM", { locale: fr })
}

export function formatDateTime(timestamp: string): string {
  return format(new Date(timestamp), "EEE d MMM HH:mm", { locale: fr })
}

export function recurrenceLabel(recurrence: Recurrence): string {
  return labels.recurrence[recurrence.unit](recurrence.interval)
}

export function placeLabel(place: Place): string {
  return place.label === "" ? labels.places.coordinates(place.latitude, place.longitude) : place.label
}

export function dueLabel(due: IsoDate, today: IsoDate): string {
  if (due === today) return labels.due.today
  if (due === addDays(today, 1)) return labels.due.tomorrow
  if (due === addDays(today, -1)) return labels.due.yesterday
  return formatShortDate(due)
}

export function dueWithTimeLabel(task: DatedTask & { due: IsoDate }, today: IsoDate): string {
  const day = dueLabel(task.due, today)
  const time = localDueTime(task)
  return time === null ? day : `${day} ${time}`
}

export function foreignDueTimeZone(task: Pick<Task, "dueTime" | "dueTimeZone">, deviceZone: string): string | null {
  if (task.dueTime === null || task.dueTimeZone === null) return null
  return task.dueTimeZone === deviceZone ? null : task.dueTimeZone
}

export function dayHeading(date: IsoDate, today: IsoDate): { title: string; detail: string } {
  const long = formatLongDate(date)
  if (date === today) return { title: labels.due.today, detail: long }
  if (date === addDays(today, 1)) return { title: labels.due.tomorrow, detail: long }
  return { title: capitalize(long), detail: "" }
}
