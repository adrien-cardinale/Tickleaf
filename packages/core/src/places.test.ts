import { describe, expect, test } from "bun:test"
import { DEFAULT_PLACE_RADIUS, distanceMeters, isInsidePlace, type Place } from "./places"

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
