export type Place = { latitude: number; longitude: number; radius: number; label: string }

export type Position = { latitude: number; longitude: number }

export const DEFAULT_PLACE_RADIUS = 100

export const PLACE_RADII = [50, 100, 250, 500, 1000] as const

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function distanceMeters(a: Position, b: Position): number {
  const latitudeDelta = toRadians(b.latitude - a.latitude)
  const longitudeDelta = toRadians(b.longitude - a.longitude)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)))
}

export function isInsidePlace(place: Place, position: Position): boolean {
  return distanceMeters(place, position) <= place.radius
}
