import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS, type Transform } from "@dnd-kit/utilities"
import type { IsoDate, Task } from "@tickleaf/core"
import { GripVertical } from "lucide-react"
import { useState } from "react"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { TaskRow } from "./task-row"

type SortableTaskListProps = {
  tasks: readonly Task[]
  today: IsoDate
  projectNameOf: (task: Task) => string | null
  onReorder: (orderedIds: string[]) => Promise<void> | void
}

type SortableTaskRowProps = {
  task: Task
  today: IsoDate
  projectName: string | null
}

function inPendingOrder(tasks: readonly Task[], pending: readonly string[] | null): readonly Task[] {
  if (pending === null) return tasks
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const ordered = pending.flatMap((id) => byId.get(id) ?? [])
  const added = tasks.filter((task) => !pending.includes(task.id))
  return [...ordered, ...added]
}

function verticalOnly(transform: Transform | null): Transform | null {
  return transform && { ...transform, x: 0 }
}

function useReorderAnnouncements(tasks: readonly Task[]): Announcements {
  const text = labels.reorder
  const titleOf = (id: UniqueIdentifier) => tasks.find((task) => task.id === id)?.title ?? labels.task.untitled
  const positionOf = (id: UniqueIdentifier) => tasks.findIndex((task) => task.id === id) + 1
  const total = tasks.length
  return {
    onDragStart: ({ active }) => text.picked(titleOf(active.id), positionOf(active.id), total),
    onDragOver: ({ active, over }) => (over ? text.moved(titleOf(active.id), positionOf(over.id), total) : undefined),
    onDragEnd: ({ active, over }) => (over ? text.dropped(titleOf(active.id), positionOf(over.id), total) : undefined),
    onDragCancel: ({ active }) => text.cancelled(titleOf(active.id)),
  }
}

function SortableTaskRow({ task, today, projectName }: SortableTaskRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={labels.task.dragHandle(task.title)}
      className="-mr-1.5 mt-0.5 grid size-[18px] shrink-0 cursor-grab touch-none place-items-center rounded-sm text-muted-foreground outline-none transition-opacity focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing pointer-coarse:size-[22px] pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100"
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(verticalOnly(transform)), transition }}
      className={cn(isDragging && "relative z-10 bg-background opacity-90 shadow-md")}
    >
      <TaskRow task={task} today={today} projectName={projectName} handle={handle} />
    </div>
  )
}

export function SortableTaskList({ tasks, today, projectNameOf, onReorder }: SortableTaskListProps) {
  const [pending, setPending] = useState<readonly string[] | null>(null)
  const ordered = inPendingOrder(tasks, pending)
  const ids = ordered.map((task) => task.id)
  const announcements = useReorderAnnouncements(ordered)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    setPending(next)
    await onReorder(next)
    setPending(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions: { draggable: labels.reorder.instructions } }}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {ordered.map((task) => (
          <SortableTaskRow key={task.id} task={task} today={today} projectName={projectNameOf(task)} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
