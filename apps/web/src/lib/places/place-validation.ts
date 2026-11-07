import { PLACE_RADII, type Place } from "@tickleaf/core"
import { MAX_LATITUDE, MAX_LONGITUDE } from "./place-draft"

function isWithin(value: number, limit: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= limit
}

function isAllowedRadius(radius: number): boolean {
  return (PLACE_RADII as readonly number[]).includes(radius)
}

export function assertValidPlace(place: Partial<Place>): void {
  if (place.latitude !== undefined && !isWithin(place.latitude, MAX_LATITUDE)) {
    throw new Error(`Latitude invalide : ${place.latitude}`)
  }
  if (place.longitude !== undefined && !isWithin(place.longitude, MAX_LONGITUDE)) {
    throw new Error(`Longitude invalide : ${place.longitude}`)
  }
  if (place.radius !== undefined && !isAllowedRadius(place.radius)) {
    throw new Error(`Rayon invalide : ${place.radius}`)
  }
}
