import { describe, expect, test } from "bun:test"
import {
  DEFAULT_PLACE_RADIUS,
  distanceMeters,
  isInsidePlace,
  isPlaceArmed,
  nextArmingTime,
  PLACE_ARMING_MARGIN_MS,
  type Place,
} from "./places"
import type { Task } from "./types"

const LAUSANNE = { latitude: 46.5197, longitude: 6.6323 }
const GENEVA = { latitude: 46.2044, longitude: 6.1432 }

function place(overrides: Partial<Place> = {}): Place {
  return { ...LAUSANNE, radius: DEFAULT_PLACE_RADIUS, label: "", ...overrides }
}

describe("distanceMeters", () => {
  test("is zero for the same point", () => {
    expect(distanceMeters(LAUSANNE, LAUSANNE)).toBe(0)
  })

  test("measures the distance between two cities", () => {
    expect(distanceMeters(LAUSANNE, GENEVA)).toBeCloseTo(51_400, -3)
  })

  test("is symmetric", () => {
    expect(distanceMeters(LAUSANNE, GENEVA)).toBeCloseTo(distanceMeters(GENEVA, LAUSANNE), 6)
  })
})

describe("isInsidePlace", () => {
  test("contains a position within the radius", () => {
    expect(isInsidePlace(place(), { latitude: 46.5203, longitude: 6.6323 })).toBe(true)
  })

  test("excludes a position beyond the radius", () => {
    expect(isInsidePlace(place(), { latitude: 46.5215, longitude: 6.6323 })).toBe(false)
  })

  test("follows the radius of the place", () => {
    expect(isInsidePlace(place({ radius: 500 }), { latitude: 46.5215, longitude: 6.6323 })).toBe(true)
  })
})

type ArmableTask = Pick<Task, "place" | "due" | "dueTime" | "dueTimeZone" | "completedAt">

function armable(overrides: Partial<ArmableTask> = {}): ArmableTask {
  return { place: place(), due: null, dueTime: null, dueTimeZone: null, completedAt: null, ...overrides }
}

describe("isPlaceArmed", () => {
  const now = new Date(2026, 10, 7, 13, 0)

  test("always arms a task without due date", () => {
    expect(isPlaceArmed(armable(), now)).toBe(true)
  })

  test("never arms a task without place", () => {
    expect(isPlaceArmed(armable({ place: null }), now)).toBe(false)
  })

  test("never arms a completed task", () => {
    expect(isPlaceArmed(armable({ completedAt: "2026-11-07T10:00:00.000Z" }), now)).toBe(false)
  })

  test("arms a task one hour before its due time", () => {
    expect(isPlaceArmed(armable({ due: "2026-11-07", dueTime: "14:00" }), now)).toBe(true)
    expect(isPlaceArmed(armable({ due: "2026-11-07", dueTime: "14:01" }), now)).toBe(false)
  })

  test("arms a task one hour before its due time in its time zone", () => {
    const task = armable({ due: "2026-07-01", dueTime: "14:00", dueTimeZone: "Europe/Zurich" })
    expect(isPlaceArmed(task, new Date("2026-07-01T10:59:00.000Z"))).toBe(false)
    expect(isPlaceArmed(task, new Date("2026-07-01T11:00:00.000Z"))).toBe(true)
  })

  test("keeps an overdue task armed", () => {
    expect(isPlaceArmed(armable({ due: "2026-11-01", dueTime: "08:00" }), now)).toBe(true)
  })

  test("arms a task without due time from 23:00 the day before", () => {
    const task = armable({ due: "2026-11-08" })
    expect(isPlaceArmed(task, new Date(2026, 10, 7, 22, 59))).toBe(false)
    expect(isPlaceArmed(task, new Date(2026, 10, 7, 23, 0))).toBe(true)
  })
})

describe("nextArmingTime", () => {
  const now = new Date(2026, 10, 7, 13, 0)

  test("is null when every task is already armed or ignored", () => {
    const tasks = [armable(), armable({ place: null, due: "2026-11-09" }), armable({ due: "2026-11-01" })]
    expect(nextArmingTime(tasks, now)).toBeNull()
  })

  test("returns the earliest upcoming arming time", () => {
    const tasks = [armable({ due: "2026-11-09" }), armable({ due: "2026-11-07", dueTime: "18:00" })]
    expect(nextArmingTime(tasks, now)).toEqual(new Date(2026, 10, 7, 17, 0))
  })

  test("ignores completed tasks", () => {
    const tasks = [armable({ due: "2026-11-07", dueTime: "18:00", completedAt: "2026-11-07T10:00:00.000Z" })]
    expect(nextArmingTime(tasks, now)).toBeNull()
  })

  test("subtracts the arming margin from the due instant", () => {
    const tasks = [armable({ due: "2026-11-07", dueTime: "20:00" })]
    expect(nextArmingTime(tasks, now)?.getTime()).toBe(new Date(2026, 10, 7, 20, 0).getTime() - PLACE_ARMING_MARGIN_MS)
  })
})
