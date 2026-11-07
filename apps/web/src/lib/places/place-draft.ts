import { DEFAULT_PLACE_RADIUS, type Place } from "@tickleaf/core"

export type PlaceDraft = { latitude: string; longitude: string; radius: number; label: string }

export const MAX_LATITUDE = 90
export const MAX_LONGITUDE = 180
const COORDINATE_DECIMALS = 6

function parseCoordinate(text: string, limit: number): number | null {
  if (text.trim() === "") return null
  const value = Number(text.replace(",", "."))
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null
}

export function roundCoordinate(value: number): number {
  return Number(value.toFixed(COORDINATE_DECIMALS))
}

export function draftFromPlace(place: Place | null): PlaceDraft {
  if (place === null) return { latitude: "", longitude: "", radius: DEFAULT_PLACE_RADIUS, label: "" }
  return { ...place, latitude: String(place.latitude), longitude: String(place.longitude) }
}

export function placeFromDraft(draft: PlaceDraft): Place | null {
  const latitude = parseCoordinate(draft.latitude, MAX_LATITUDE)
  const longitude = parseCoordinate(draft.longitude, MAX_LONGITUDE)
  if (latitude === null || longitude === null) return null
  return { latitude, longitude, radius: draft.radius, label: draft.label.trim() }
}
