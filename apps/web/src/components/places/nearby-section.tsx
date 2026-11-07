import type { IsoDate, Position, Task } from "@tickleaf/core"
import { useMemo } from "react"
import { TaskSection } from "@/components/tasks/task-section"
import { useArmingClock } from "@/hooks/use-arming-clock"
import { useCurrentPosition } from "@/hooks/use-current-position"
import { labels } from "@/lib/labels"
import { formatDistance } from "@/lib/places/distance"
import { type NearbyTask, nearbyTasks } from "@/lib/places/nearby"

type NearbySectionProps = {
  tasks: readonly Task[]
  today: IsoDate
  projectNameOf: (task: Task) => string | null
}

type NearbyListProps = Omit<NearbySectionProps, "tasks"> & { nearby: readonly NearbyTask[] }

function distanceText(entry: NearbyTask): string {
  return entry.onSite ? labels.places.onSite : formatDistance(entry.distance)
}

function NearbyList({ nearby, today, projectNameOf }: NearbyListProps) {
  const details = new Map(nearby.map((entry) => [entry.task.id, distanceText(entry)]))
  return (
    <TaskSection
      title={labels.places.nearby}
      tasks={nearby.map((entry) => entry.task)}
      today={today}
      projectNameOf={projectNameOf}
      placeDetailOf={(task) => details.get(task.id)}
    />
  )
}

function NearbyHint({ text, today }: { text: string; today: IsoDate }) {
  return <TaskSection title={labels.places.nearby} tasks={[]} today={today} empty={text} projectNameOf={() => null} />
}

function LocatedNearby({ position, tasks, ...rest }: NearbySectionProps & { position: Position }) {
  const now = useArmingClock(tasks)
  const nearby = useMemo(() => nearbyTasks(tasks, position, now), [tasks, position, now])
  if (nearby.length === 0) return null
  return <NearbyList nearby={nearby} {...rest} />
}

export function NearbySection({ tasks, today, projectNameOf }: NearbySectionProps) {
  const placed = useMemo(() => tasks.filter((task) => task.place !== null), [tasks])
  const reading = useCurrentPosition(placed.length > 0)
  if (placed.length === 0) return null
  switch (reading.status) {
    case "pending":
      return null
    case "denied":
      return <NearbyHint text={labels.places.permissionHint} today={today} />
    case "unavailable":
      return <NearbyHint text={labels.places.unavailableHint} today={today} />
    case "located":
      return <LocatedNearby position={reading.position} tasks={placed} today={today} projectNameOf={projectNameOf} />
  }
}
