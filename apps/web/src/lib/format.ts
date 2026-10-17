import { addDays, fromIsoDate, type IsoDate, type Recurrence } from "@tickleaf/core"
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

export function toDateTimeInput(timestamp: string | null): string {
  return timestamp === null ? "" : format(new Date(timestamp), "yyyy-MM-dd'T'HH:mm")
}

export function fromDateTimeInput(value: string): string | null {
  return value === "" ? null : new Date(value).toISOString()
}

export function recurrenceLabel(recurrence: Recurrence): string {
  return labels.recurrence[recurrence.unit](recurrence.interval)
}

export function dueLabel(due: IsoDate, today: IsoDate): string {
  if (due === today) return labels.due.today
  if (due === addDays(today, 1)) return labels.due.tomorrow
  if (due === addDays(today, -1)) return labels.due.yesterday
  return formatShortDate(due)
}

export function dayHeading(date: IsoDate, today: IsoDate): { title: string; detail: string } {
  const long = formatLongDate(date)
  if (date === today) return { title: labels.due.today, detail: long }
  if (date === addDays(today, 1)) return { title: labels.due.tomorrow, detail: long }
  return { title: capitalize(long), detail: "" }
}
