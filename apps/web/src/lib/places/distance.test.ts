import { describe, expect, test } from "bun:test"
import { formatDistance } from "./distance"

describe("formatDistance", () => {
  test("shows metres below one kilometre", () => {
    expect(formatDistance(850.4)).toBe("850 m")
  })

  test("shows kilometres with a French decimal comma", () => {
    expect(formatDistance(2_340)).toBe("2,3 km")
  })

  test("switches to kilometres when metres round up to 1000", () => {
    expect(formatDistance(999.6)).toBe("1 km")
  })
})
