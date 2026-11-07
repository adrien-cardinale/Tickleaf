import { describe, expect, test } from "bun:test"
import { isTimeZone, zonedInstant } from "./time-zone"

describe("zonedInstant", () => {
  test("reads a summer time in Zurich at UTC+2", () => {
    expect(zonedInstant("2026-07-01", "14:30", "Europe/Zurich").toISOString()).toBe("2026-07-01T12:30:00.000Z")
  })

  test("reads a winter time in Zurich at UTC+1", () => {
    expect(zonedInstant("2026-01-15", "14:30", "Europe/Zurich").toISOString()).toBe("2026-01-15T13:30:00.000Z")
  })

  test("reads a time in New York", () => {
    expect(zonedInstant("2026-11-07", "14:30", "America/New_York").toISOString()).toBe("2026-11-07T19:30:00.000Z")
    expect(zonedInstant("2026-07-01", "14:30", "America/New_York").toISOString()).toBe("2026-07-01T18:30:00.000Z")
  })

  test("reads a half-hour offset in Kolkata", () => {
    expect(zonedInstant("2026-11-07", "14:30", "Asia/Kolkata").toISOString()).toBe("2026-11-07T09:00:00.000Z")
  })

  test("crosses the day boundary", () => {
    expect(zonedInstant("2026-11-07", "00:15", "Asia/Kolkata").toISOString()).toBe("2026-11-06T18:45:00.000Z")
  })

  test("falls back to the local time for an unknown time zone", () => {
    expect(zonedInstant("2026-07-01", "14:30", "Mars/Olympus")).toEqual(new Date(2026, 6, 1, 14, 30))
  })

  test("handles the spring forward day in Zurich", () => {
    expect(zonedInstant("2026-03-29", "01:30", "Europe/Zurich").toISOString()).toBe("2026-03-29T00:30:00.000Z")
    expect(zonedInstant("2026-03-29", "03:30", "Europe/Zurich").toISOString()).toBe("2026-03-29T01:30:00.000Z")
    expect(zonedInstant("2026-03-29", "02:30", "Europe/Zurich").toISOString()).toBe("2026-03-29T01:30:00.000Z")
  })

  test("handles the fall back day in Zurich", () => {
    expect(zonedInstant("2026-10-25", "00:30", "Europe/Zurich").toISOString()).toBe("2026-10-24T22:30:00.000Z")
    expect(zonedInstant("2026-10-25", "04:00", "Europe/Zurich").toISOString()).toBe("2026-10-25T03:00:00.000Z")
  })
})

describe("isTimeZone", () => {
  test("accepts an IANA time zone and rejects an unknown one", () => {
    expect(isTimeZone("Europe/Zurich")).toBe(true)
    expect(isTimeZone("Mars/Olympus")).toBe(false)
  })
})
