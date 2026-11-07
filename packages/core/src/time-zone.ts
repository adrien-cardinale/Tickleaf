import type { DueTime, IsoDate } from "./types"

const formatters = new Map<string, Intl.DateTimeFormat>()

function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  formatters.set(timeZone, formatter)
  return formatter
}

function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = zoneFormatter(timeZone).formatToParts(new Date(instant))
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((entry) => entry.type === type)?.value)
  const wallClock = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"))
  return wallClock - Math.floor(instant / 1000) * 1000
}

function wallClockFields(date: IsoDate, time: DueTime): [number, number, number, number, number] {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number)
  const [hours = 0, minutes = 0] = time.split(":").map(Number)
  return [year, month - 1, day, hours, minutes]
}

export function isTimeZone(value: string): boolean {
  try {
    zoneFormatter(value)
    return true
  } catch {
    return false
  }
}

export function zonedInstant(date: IsoDate, time: DueTime, timeZone: string): Date {
  const fields = wallClockFields(date, time)
  if (!isTimeZone(timeZone)) return new Date(...fields)
  const wallClockAsUtc = Date.UTC(...fields)
  const firstOffset = zoneOffsetMs(wallClockAsUtc, timeZone)
  const secondOffset = zoneOffsetMs(wallClockAsUtc - firstOffset, timeZone)
  return new Date(wallClockAsUtc - secondOffset)
}
