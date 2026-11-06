import { distanceMeters, type Position, type Task } from "@tickleaf/core"
import { labels } from "@/lib/labels"
import { notificationId } from "@/lib/reminders/reminder-plan"

export type GeofenceTarget = {
  id: number
  taskId: string
  title: string
  body: string
  latitude: number
  longitude: number
  radius: number
}

export type ArrivalCheck = { arrivals: GeofenceTarget[]; inside: Set<string> }

function arrivalBody(label: string): string {
  return label === "" ? labels.places.body : labels.places.bodyAt(label)
}

export function geofenceTargets(tasks: readonly Task[]): GeofenceTarget[] {
  return tasks.flatMap((task) => {
    if (task.completedAt !== null || task.place === null) return []
    const { latitude, longitude, radius, label } = task.place
    return [
      {
        id: notificationId(task.id),
        taskId: task.id,
        title: task.title,
        body: arrivalBody(label),
        latitude,
        longitude,
        radius,
      },
    ]
  })
}

export function checkArrivals(
  targets: readonly GeofenceTarget[],
  position: Position,
  alreadyInside: ReadonlySet<string>,
): ArrivalCheck {
  const reached = targets.filter((target) => distanceMeters(target, position) <= target.radius)
  return {
    arrivals: reached.filter((target) => !alreadyInside.has(target.taskId)),
    inside: new Set(reached.map((target) => target.taskId)),
  }
}
