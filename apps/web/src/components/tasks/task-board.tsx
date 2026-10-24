import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  getFirstCollision,
  MeasuringStrategy,
  type Modifier,
  pointerWithin,
  rectIntersection,
  type UniqueIdentifier,
  useDroppable,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { IsoDate, Task } from "@tickleaf/core"
import { GripVertical } from "lucide-react"
import { createContext, type ReactNode, useContext, useRef, useState } from "react"
import { labels } from "@/lib/labels"
import { reorderAnnouncements, type Slot, SortableTaskRow, useTaskSensors } from "./sortable-task-list"
import { TaskRow } from "./task-row"

export type BoardColumn = { id: string; tasks: readonly Task[] }

type Placement = Readonly<Record<string, readonly string[]>>

type TaskBoardProps = {
  columns: readonly BoardColumn[]
  today: IsoDate
  projectNameOf: (task: Task) => string | null
  onMove: (taskId: string, columnId: string, orderedIds: string[]) => Promise<void> | void
  children: ReactNode
}

type BoardColumnListProps = {
  columnId: string
  tasks: readonly Task[]
  today: IsoDate
  projectNameOf: (task: Task) => string | null
  empty: ReactNode
}

type Board = { placement: Placement | null; taskById: ReadonlyMap<string, Task> }

const BoardContext = createContext<Board | null>(null)

const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } }

const verticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

function placementOf(columns: readonly BoardColumn[]): Placement {
  return Object.fromEntries(columns.map((column) => [column.id, column.tasks.map((task) => task.id)]))
}

function columnOf(placement: Placement, id: UniqueIdentifier): string | undefined {
  const key = String(id)
  if (key in placement) return key
  return Object.keys(placement).find((column) => placement[column]?.includes(key))
}

function insertionIndex(target: readonly string[], overId: string, belowOver: boolean): number {
  const overIndex = target.indexOf(overId)
  if (overIndex === -1) return target.length
  return belowOver ? overIndex + 1 : overIndex
}

function moveAcross(placement: Placement, activeId: string, overId: string, belowOver: boolean): Placement {
  const from = columnOf(placement, activeId)
  const to = columnOf(placement, overId)
  if (!from || !to || from === to) return placement
  const target = placement[to] ?? []
  const insertAt = insertionIndex(target, overId, belowOver)
  return {
    ...placement,
    [from]: (placement[from] ?? []).filter((id) => id !== activeId),
    [to]: [...target.slice(0, insertAt), activeId, ...target.slice(insertAt)],
  }
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function DragPreview({ task, today, projectName }: { task: Task; today: IsoDate; projectName: string | null }) {
  const handle = (
    <span className="-mr-1.5 mt-0.5 grid size-[18px] shrink-0 cursor-grabbing place-items-center text-muted-foreground pointer-coarse:size-[22px]">
      <GripVertical className="size-4" aria-hidden="true" />
    </span>
  )
  return (
    <div className="bg-background opacity-90 shadow-md">
      <TaskRow task={task} today={today} projectName={projectName} handle={handle} />
    </div>
  )
}

export function TaskBoard({ columns, today, projectNameOf, onMove, children }: TaskBoardProps) {
  const [placement, setPlacement] = useState<Placement | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const lastOverId = useRef<UniqueIdentifier | null>(null)
  const movedToNewColumn = useRef(false)
  const sensors = useTaskSensors()
  const current = placement ?? placementOf(columns)
  const taskById = new Map(columns.flatMap((column) => column.tasks.map((task) => [task.id, task] as const)))
  const activeTask = activeId ? taskById.get(activeId) : undefined

  const collisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args)
    const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args)
    let overId = getFirstCollision(hits, "id")
    if (overId != null) {
      const columnIds = current[String(overId)]
      if (columnIds && columnIds.length > 0) {
        const candidates = args.droppableContainers.filter((container) => columnIds.includes(String(container.id)))
        overId = closestCenter({ ...args, droppableContainers: candidates })[0]?.id ?? overId
      }
      lastOverId.current = overId
      return [{ id: overId }]
    }
    if (movedToNewColumn.current) lastOverId.current = activeId
    return lastOverId.current ? [{ id: lastOverId.current }] : []
  }

  const slotOf = (id: UniqueIdentifier): Slot => {
    const ids = current[columnOf(current, id) ?? ""] ?? []
    const index = ids.indexOf(String(id))
    return index === -1
      ? { position: ids.length + 1, total: ids.length + 1 }
      : { position: index + 1, total: ids.length }
  }
  const announcements = reorderAnnouncements((id) => taskById.get(String(id))?.title ?? labels.task.untitled, slotOf)

  const reset = () => {
    setActiveId(null)
    setPlacement(null)
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    setPlacement(placementOf(columns))
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const translated = active.rect.current.translated
    const belowOver = translated !== null && translated.top > over.rect.top + over.rect.height / 2
    setPlacement((previous) => {
      const base = previous ?? placementOf(columns)
      const next = moveAcross(base, String(active.id), String(over.id), belowOver)
      if (next !== base) movedToNewColumn.current = true
      return next
    })
    requestAnimationFrame(() => {
      movedToNewColumn.current = false
    })
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    const id = String(active.id)
    const column = columnOf(current, id)
    setActiveId(null)
    if (!over || !column) return reset()
    const ids = current[column] ?? []
    const overIndex = ids.indexOf(String(over.id))
    const ordered = overIndex === -1 ? [...ids] : arrayMove([...ids], ids.indexOf(id), overIndex)
    const original = columns.find((candidate) => candidate.id === column)?.tasks.map((task) => task.id) ?? []
    if (sameOrder(ordered, original)) return reset()
    setPlacement({ ...current, [column]: ordered })
    await onMove(id, column, ordered)
    setPlacement(null)
  }

  return (
    <BoardContext.Provider value={{ placement, taskById }}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={MEASURING}
        accessibility={{ announcements, screenReaderInstructions: { draggable: labels.reorder.instructions } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={(event) => void handleDragEnd(event)}
        onDragCancel={reset}
      >
        {children}
        <DragOverlay modifiers={[verticalAxis]}>
          {activeTask && <DragPreview task={activeTask} today={today} projectName={projectNameOf(activeTask)} />}
        </DragOverlay>
      </DndContext>
    </BoardContext.Provider>
  )
}

export function BoardColumnList({ columnId, tasks, today, projectNameOf, empty }: BoardColumnListProps) {
  const board = useContext(BoardContext)
  const { setNodeRef } = useDroppable({ id: columnId })
  const pendingIds = board?.placement?.[columnId]
  const shown = pendingIds ? pendingIds.flatMap((id) => board?.taskById.get(id) ?? []) : tasks
  const ids = shown.map((task) => task.id)

  return (
    <SortableContext id={columnId} items={ids} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className="flex flex-col">
        {shown.length === 0
          ? empty
          : shown.map((task) => (
              <SortableTaskRow key={task.id} task={task} today={today} projectName={projectNameOf(task)} placeholder />
            ))}
      </div>
    </SortableContext>
  )
}
