import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  getFirstCollision,
  type Modifier,
  pointerWithin,
  rectIntersection,
  type UniqueIdentifier,
  useDroppable,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { Coordinates } from "@dnd-kit/utilities"
import type { IsoDate, Task } from "@tickleaf/core"
import { GripVertical } from "lucide-react"
import {
  createContext,
  type ReactNode,
  startTransition,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { labels } from "@/lib/labels"
import {
  reorderAnnouncements,
  SCREEN_READER_INSTRUCTIONS,
  type Slot,
  SortableTaskRow,
  useTaskSensors,
} from "./sortable-task-list"
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

const verticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

const VERTICAL_ONLY = [verticalAxis]

const ORIGIN: Coordinates = { x: 0, y: 0 }

// Blocks the column ping-pong of dnd-kit issue #1678 until the pointer really moves.
const CROSSING_SLOP = 8

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

function slotIn(placement: Placement, id: UniqueIdentifier): Slot {
  const ids = placement[columnOf(placement, id) ?? ""] ?? []
  const index = ids.indexOf(String(id))
  return index === -1 ? { position: ids.length + 1, total: ids.length + 1 } : { position: index + 1, total: ids.length }
}

function isBelow({ active, over }: DragOverEvent): boolean {
  const translated = active.rect.current.translated
  return over !== null && translated !== null && translated.top > over.rect.top + over.rect.height / 2
}

function distance(from: Coordinates, to: Coordinates): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}

function closestHit(args: Parameters<CollisionDetection>[0], placement: Placement): UniqueIdentifier | null {
  const pointerHits = pointerWithin(args)
  const hit = getFirstCollision(pointerHits.length > 0 ? pointerHits : rectIntersection(args), "id")
  if (hit == null) return null
  const columnIds = placement[String(hit)]
  if (!columnIds || columnIds.length === 0) return hit
  const candidates = args.droppableContainers.filter((container) => columnIds.includes(String(container.id)))
  return closestCenter({ ...args, droppableContainers: candidates })[0]?.id ?? hit
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
  const sensors = useTaskSensors()
  const current = useMemo(() => placement ?? placementOf(columns), [placement, columns])
  const taskById = useMemo(
    () => new Map(columns.flatMap((column) => column.tasks.map((task) => [task.id, task] as const))),
    [columns],
  )
  const activeTask = activeId ? taskById.get(activeId) : undefined

  const rendered = useRef({ current, taskById })
  useLayoutEffect(() => {
    rendered.current = { current, taskById }
  })
  const draft = useRef<Placement | null>(null)
  const lastOverId = useRef<UniqueIdentifier | null>(null)
  const pendingOver = useRef<DragOverEvent | null>(null)
  const frame = useRef<number | null>(null)
  const pointer = useRef<Coordinates>(ORIGIN)
  const crossedAt = useRef<Coordinates | null>(null)

  const livePlacement = useCallback(() => draft.current ?? rendered.current.current, [])

  const crossingLocked = useCallback(
    () => crossedAt.current !== null && distance(crossedAt.current, pointer.current) < CROSSING_SLOP,
    [],
  )

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const live = livePlacement()
      const activeColumn = columnOf(live, args.active.id)
      let overId = closestHit(args, live)
      if (overId != null && crossingLocked() && columnOf(live, overId) !== activeColumn) overId = lastOverId.current
      if (overId != null) {
        lastOverId.current = overId
        return [{ id: overId }]
      }
      if (crossingLocked()) lastOverId.current = args.active.id
      return lastOverId.current ? [{ id: lastOverId.current }] : []
    },
    [livePlacement, crossingLocked],
  )

  const announcements = useMemo(
    () =>
      reorderAnnouncements(
        (id) => rendered.current.taskById.get(String(id))?.title ?? labels.task.untitled,
        (id) => slotIn(livePlacement(), id),
      ),
    [livePlacement],
  )
  const accessibility = useMemo(
    () => ({ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }),
    [announcements],
  )

  const commitDraft = (next: Placement | null) => {
    draft.current = next
    startTransition(() => setPlacement(next))
  }

  const settlePendingOver = (): Placement => {
    const event = pendingOver.current
    pendingOver.current = null
    const live = livePlacement()
    if (!event?.over) return live
    const next = moveAcross(live, String(event.active.id), String(event.over.id), isBelow(event))
    if (next !== live) {
      draft.current = next
      crossedAt.current = pointer.current
    }
    return next
  }

  const cancelFrame = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
  }

  const clearDrag = () => {
    cancelFrame()
    pendingOver.current = null
    lastOverId.current = null
    crossedAt.current = null
    pointer.current = ORIGIN
  }

  const reset = () => {
    clearDrag()
    setActiveId(null)
    commitDraft(null)
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    clearDrag()
    setActiveId(String(active.id))
    draft.current = placementOf(columns)
    setPlacement(draft.current)
  }

  const handleDragMove = ({ delta }: DragMoveEvent) => {
    pointer.current = delta
  }

  const handleDragOver = (event: DragOverEvent) => {
    pointer.current = event.delta
    pendingOver.current = event
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      const before = livePlacement()
      const next = settlePendingOver()
      if (next !== before) commitDraft(next)
    })
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    const settled = settlePendingOver()
    clearDrag()
    const id = String(active.id)
    const column = columnOf(settled, id)
    setActiveId(null)
    if (!over || !column) return reset()
    const ids = settled[column] ?? []
    const overIndex = ids.indexOf(String(over.id))
    const ordered = overIndex === -1 ? [...ids] : arrayMove([...ids], ids.indexOf(id), overIndex)
    const original = columns.find((candidate) => candidate.id === column)?.tasks.map((task) => task.id) ?? []
    if (sameOrder(ordered, original)) return reset()
    commitDraft({ ...settled, [column]: ordered })
    await onMove(id, column, ordered)
    commitDraft(null)
  }

  const board = useMemo(() => ({ placement, taskById }), [placement, taskById])

  return (
    <BoardContext.Provider value={board}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={accessibility}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={(event) => void handleDragEnd(event)}
        onDragCancel={reset}
      >
        {children}
        <DragOverlay modifiers={VERTICAL_ONLY}>
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
  const taskById = board?.taskById
  const shown = useMemo(
    () => (pendingIds && taskById ? pendingIds.flatMap((id) => taskById.get(id) ?? []) : tasks),
    [pendingIds, taskById, tasks],
  )
  const ids = useMemo(() => shown.map((task) => task.id), [shown])

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
