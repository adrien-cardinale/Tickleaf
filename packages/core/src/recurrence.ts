import { addDays, addMonths, isWeekend } from "./dates"
import type { IsoDate } from "./types"

export const RECURRENCE_UNITS = ["day", "weekday", "week", "month", "year"] as const

export type RecurrenceUnit = (typeof RECURRENCE_UNITS)[number]

export type Recurrence = { unit: RecurrenceUnit; interval: number }

export const MAX_RECURRENCE_INTERVAL = 999

function addWeekdays(value: IsoDate, count: number): IsoDate {
  let date = value
  for (let added = 0; added < count; ) {
    date = addDays(date, 1)
    if (!isWeekend(date)) added += 1
  }
  return date
}

function shift(base: IsoDate, recurrence: Recurrence, steps: number): IsoDate {
  const count = recurrence.interval * steps
  switch (recurrence.unit) {
    case "day":
      return addDays(base, count)
    case "weekday":
      return addWeekdays(base, count)
    case "week":
      return addDays(base, 7 * count)
    case "month":
      return addMonths(base, count)
    case "year":
      return addMonths(base, 12 * count)
  }
}

export function nextOccurrence(due: IsoDate | null, recurrence: Recurrence, today: IsoDate): IsoDate {
  const base = due ?? today
  let steps = 1
  let next = shift(base, recurrence, steps)
  while (next <= today) {
    steps += 1
    next = shift(base, recurrence, steps)
  }
  return next
}
