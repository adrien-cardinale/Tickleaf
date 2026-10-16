import type { IsoDate } from "./types"

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const

export type Weekday = (typeof WEEKDAYS)[number]

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayIso(now: Date = new Date()): IsoDate {
  return toIsoDate(now)
}

export function makeDate(year: number, month: number, day: number): IsoDate | null {
  const date = new Date(year, month - 1, day)
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return valid ? toIsoDate(date) : null
}

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string") return false
  const match = ISO_DATE.exec(value)
  if (!match) return false
  return makeDate(Number(match[1]), Number(match[2]), Number(match[3])) === value
}

export function fromIsoDate(value: IsoDate): Date {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const date = fromIsoDate(value)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export function nextWeekday(weekday: Weekday, today: IsoDate): IsoDate {
  const target = WEEKDAYS.indexOf(weekday)
  const current = fromIsoDate(today).getDay()
  const delta = (target - current + 7) % 7
  return addDays(today, delta === 0 ? 7 : delta)
}

export function nextDayMonth(day: number, month: number, today: IsoDate): IsoDate | null {
  const year = fromIsoDate(today).getFullYear()
  const thisYear = makeDate(year, month, day)
  if (thisYear === null || thisYear >= today) return thisYear
  return makeDate(year + 1, month, day)
}
