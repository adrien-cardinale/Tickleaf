import { describe, expect, test } from "bun:test"
import { DEFAULT_PLACE_RADIUS } from "@tickleaf/core"
import { draftFromPlace, placeFromDraft, roundCoordinate } from "./place-draft"

describe("placeFromDraft", () => {
  test("builds a place from valid coordinates", () => {
    const draft = { latitude: "46,5197", longitude: "6.6323", radius: 250, label: " Bureau " }
    expect(placeFromDraft(draft)).toEqual({ latitude: 46.5197, longitude: 6.6323, radius: 250, label: "Bureau" })
  })

  test("refuses missing or out of range coordinates", () => {
    expect(placeFromDraft({ latitude: "", longitude: "6.6", radius: 100, label: "" })).toBeNull()
    expect(placeFromDraft({ latitude: "91", longitude: "6.6", radius: 100, label: "" })).toBeNull()
    expect(placeFromDraft({ latitude: "46.5", longitude: "abc", radius: 100, label: "" })).toBeNull()
  })
})

describe("draftFromPlace", () => {
  test("starts empty with the default radius", () => {
    expect(draftFromPlace(null)).toEqual({ latitude: "", longitude: "", radius: DEFAULT_PLACE_RADIUS, label: "" })
  })
})

describe("roundCoordinate", () => {
  test("keeps six decimals", () => {
    expect(roundCoordinate(46.519712345)).toBe(46.519712)
  })
})
