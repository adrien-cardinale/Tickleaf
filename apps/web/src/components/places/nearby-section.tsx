import type { Position, Task } from "@tickleaf/core"
import { useMemo } from "react"
import { TaskSection } from "@/components/tasks/task-section"
import { useArmingClock } from "@/hooks/use-arming-clock"
import { useCurrentPosition } from "@/hooks/use-current-position"
import { labels } from "@/lib/labels"
import { formatDistance } from "@/lib/places/distance"
import { type NearbyTask, nearbyTasks } from "@/lib/places/nearby"

type NearbySectionProps = {
  tasks: readonly Task[]
  now: Date
  projectNameOf: (task: Task) => string | null
}

type NearbyListProps = Omit<NearbySectionProps, "tasks"> & { nearby: readonly NearbyTask[] }

function distanceText(entry: NearbyTask): string {
  return entry.onSite ? labels.places.onSite : formatDistance(entry.distance)
}

function NearbyList({ nearby, now, projectNameOf }: NearbyListProps) {
  const details = new Map(nearby.map((entry) => [entry.task.id, distanceText(entry)]))
  return (
    <TaskSection
      title={labels.places.nearby}
      tasks={nearby.map((entry) => entry.task)}
      now={now}
      projectNameOf={projectNameOf}
      placeDetailOf={(task) => details.get(task.id)}
    />
  )
}

function NearbyHint({ text, now }: { text: string; now: Date }) {
  return <TaskSection title={labels.places.nearby} tasks={[]} now={now} empty={text} projectNameOf={() => null} />
}

function LocatedNearby({ position, tasks, ...rest }: NearbySectionProps & { position: Position }) {
  const armingTime = useArmingClock(tasks)
  const nearby = useMemo(() => nearbyTasks(tasks, position, armingTime), [tasks, position, armingTime])
  if (nearby.length === 0) return null
  return <NearbyList nearby={nearby} {...rest} />
}

export function NearbySection({ tasks, now, projectNameOf }: NearbySectionProps) {
  const placed = useMemo(() => tasks.filter((task) => task.place !== null), [tasks])
  const reading = useCurrentPosition(placed.length > 0)
  if (placed.length === 0) return null
  switch (reading.status) {
    case "pending":
      return null
    case "denied":
      return <NearbyHint text={labels.places.permissionHint} now={now} />
    case "unavailable":
      return <NearbyHint text={labels.places.unavailableHint} now={now} />
    case "located":
      return <LocatedNearby position={reading.position} tasks={placed} now={now} projectNameOf={projectNameOf} />
  }
}
