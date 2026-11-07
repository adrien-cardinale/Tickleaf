import { distanceMeters, isPlaceArmed, type Place, type Position, type Task } from "@tickleaf/core"

export const NEARBY_DISTANCE_METERS = 5_000

export type NearbyTask = { task: Task; distance: number; onSite: boolean }

function measure(task: Task, place: Place, position: Position): NearbyTask {
  const distance = distanceMeters(place, position)
  return { task, distance, onSite: distance <= place.radius }
}

function compareNearby(left: NearbyTask, right: NearbyTask): number {
  if (left.onSite !== right.onSite) return left.onSite ? -1 : 1
  return left.distance - right.distance
}

export function nearbyTasks(
  tasks: readonly Task[],
  position: Position,
  now: Date,
  maxDistance: number = NEARBY_DISTANCE_METERS,
): NearbyTask[] {
  return tasks
    .flatMap((task) => (task.place !== null && isPlaceArmed(task, now) ? [measure(task, task.place, position)] : []))
    .filter((nearby) => nearby.onSite || nearby.distance <= maxDistance)
    .sort(compareNearby)
}
