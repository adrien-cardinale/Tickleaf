import { dueInstant } from "./due"
import type { Task } from "./types"

export type Place = { latitude: number; longitude: number; radius: number; label: string }

export type FavoritePlace = Place & { id: string; position: number; createdAt: string; updatedAt: string }

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

export const PLACE_ARMING_MARGIN_MS = 60 * 60 * 1000

type ArmableTask = Pick<Task, "place" | "due" | "dueTime" | "completedAt">

export function placeArmingTime(task: Pick<Task, "due" | "dueTime">): Date | null {
  const instant = dueInstant(task)
  return instant === null ? null : new Date(instant.getTime() - PLACE_ARMING_MARGIN_MS)
}

export function isPlaceArmed(task: ArmableTask, now: Date): boolean {
  if (task.completedAt !== null || task.place === null) return false
  const armingTime = placeArmingTime(task)
  return armingTime === null || now.getTime() >= armingTime.getTime()
}

export function nextArmingTime(tasks: readonly ArmableTask[], now: Date): Date | null {
  let next: Date | null = null
  for (const task of tasks) {
    if (task.completedAt !== null || task.place === null) continue
    const armingTime = placeArmingTime(task)
    if (armingTime === null || armingTime.getTime() <= now.getTime()) continue
    if (next === null || armingTime.getTime() < next.getTime()) next = armingTime
  }
  return next
}
