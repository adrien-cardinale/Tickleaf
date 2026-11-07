import { describe, expect, test } from "bun:test"
import { assertValidPlace } from "./place-validation"

describe("assertValidPlace", () => {
  test("accepts a complete valid place", () => {
    expect(() => assertValidPlace({ latitude: 46.5, longitude: 6.6, radius: 250, label: "Bureau" })).not.toThrow()
  })

  test("accepts boundary coordinates and partial patches", () => {
    expect(() => assertValidPlace({ latitude: -90, longitude: 180 })).not.toThrow()
    expect(() => assertValidPlace({ label: "Maison" })).not.toThrow()
  })

  test("refuses out of range coordinates", () => {
    expect(() => assertValidPlace({ latitude: 90.1 })).toThrow()
    expect(() => assertValidPlace({ longitude: -180.5 })).toThrow()
    expect(() => assertValidPlace({ latitude: Number.NaN })).toThrow()
  })

  test("refuses a radius outside the allowed list", () => {
    expect(() => assertValidPlace({ radius: 75 })).toThrow()
  })
})
