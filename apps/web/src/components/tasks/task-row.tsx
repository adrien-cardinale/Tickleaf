import {
  DEFAULT_PROJECT_COLOR,
  isOverdue,
  type ProjectColor,
  subtaskProgress,
  type Task,
  todayIso,
} from "@tickleaf/core"
import { ListChecks, MapPin, Repeat } from "lucide-react"
import type { KeyboardEvent, MouseEvent, ReactNode } from "react"
import { ProjectDot } from "@/components/project-dot"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useWorkspace } from "@/components/workspace-context"
import { useTaskActions } from "@/hooks/use-task-actions"
import { dueWithTimeLabel, foreignDueTimeZone, recurrenceLabel } from "@/lib/format"
import { labels } from "@/lib/labels"
import { useProjects, useSubtasks } from "@/lib/queries"
import { deviceTimeZone } from "@/lib/services/clock"
import { hasAnyModifier, isModifierKey, TASK_ROW_ATTRIBUTE, TOGGLE_TASK_KEYS } from "@/lib/shortcuts"
import { cn } from "@/lib/utils"
import { PriorityCheck } from "./priority-check"
import { TaskContextMenu } from "./task-context-menu"

type TaskRowProps = {
  task: Task
  now: Date
  projectName: string | null
  handle?: ReactNode
  placeDetail?: string
}

function useProjectColor(projectId: string | null): ProjectColor {
  const { data: projects } = useProjects()
  return projects?.find((project) => project.id === projectId)?.color ?? DEFAULT_PROJECT_COLOR
}

function placeText(task: Task, detail: string | undefined): string {
  return [task.place?.label, detail].filter(Boolean).join(" · ")
}

function SavedTimeZone({ task }: { task: Task }) {
  const zone = foreignDueTimeZone(task, deviceTimeZone())
  if (zone === null || task.dueTime === null) return null
  return <span className="opacity-70">{labels.due.savedTime(task.dueTime, zone)}</span>
}

function isSelectionClick(event: MouseEvent): boolean {
  return event.shiftKey || isModifierKey(event)
}

type SelectCheckProps = {
  task: Task
  selected: boolean
  selecting: boolean
  onToggle: () => void
}

function SelectCheck({ task, selected, selecting, onToggle }: SelectCheckProps) {
  return (
    <Checkbox
      checked={selected}
      onCheckedChange={onToggle}
      tabIndex={selecting ? 0 : -1}
      aria-label={labels.selection.select(task.title)}
      className={cn(
        "-mr-1 mt-0.5 transition-opacity pointer-coarse:size-[18px]",
        !selecting &&
          "pointer-coarse:hidden pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100",
      )}
    />
  )
}

function dueClass(task: Task, now: Date): string {
  if (isOverdue(task, now)) return "text-red-600 dark:text-red-400"
  if (task.completedAt === null && task.due === todayIso(now)) return "font-medium text-foreground"
  return ""
}

export function TaskRow({ task, now, projectName, handle, placeDetail }: TaskRowProps) {
  const today = todayIso(now)
  const { selectedTaskId, openTask, selectedIds, toggleSelected } = useWorkspace()
  const { toggle } = useTaskActions()
  const { data: subtasks = [] } = useSubtasks(task.id)
  const progress = subtaskProgress(subtasks)
  const projectColor = useProjectColor(task.projectId)
  const done = task.completedAt !== null
  const hasMeta =
    task.due !== null || task.place !== null || projectName !== null || task.description !== "" || progress.total > 0
  const rowAttributes = { [TASK_ROW_ATTRIBUTE]: task.id }
  const selected = selectedIds.has(task.id)
  const selecting = selectedIds.size > 0

  const openOrSelect = (event: MouseEvent<HTMLButtonElement>) => {
    if (!isSelectionClick(event)) {
      openTask(task.id)
      return
    }
    event.preventDefault()
    toggleSelected(task.id)
  }

  const keepTextUnselected = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.shiftKey) event.preventDefault()
  }

  const toggleOnKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (hasAnyModifier(event) || !TOGGLE_TASK_KEYS.includes(event.key)) return
    event.preventDefault()
    void toggle(task)
  }

  return (
    <TaskContextMenu task={task} today={today}>
      <div
        className={cn(
          "group flex items-start gap-3 border-b px-2 py-2.5 transition-colors hover:bg-muted/50",
          selectedTaskId === task.id && "bg-muted",
          selected && "bg-primary/10 hover:bg-primary/15",
        )}
      >
        <SelectCheck task={task} selected={selected} selecting={selecting} onToggle={() => toggleSelected(task.id)} />
        {handle}
        <PriorityCheck
          priority={task.priority}
          done={done}
          label={done ? labels.task.reopen(task.title) : labels.task.complete(task.title)}
          onToggle={() => void toggle(task)}
        />
        <button
          type="button"
          onClick={openOrSelect}
          onMouseDown={keepTextUnselected}
          onKeyDown={toggleOnKey}
          {...rowAttributes}
          className="min-w-0 flex-1 cursor-pointer rounded-sm text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span
            className={cn("block leading-snug [overflow-wrap:anywhere]", done && "text-muted-foreground line-through")}
          >
            {task.title}
          </span>
          {hasMeta && (
            <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {task.due !== null && (
                <span className={cn("inline-flex items-center gap-1", dueClass(task, now))}>
                  {dueWithTimeLabel({ ...task, due: task.due }, today)}
                  <SavedTimeZone task={task} />
                  {task.recurrence !== null && (
                    <Repeat className="size-3" role="img" aria-label={recurrenceLabel(task.recurrence)} />
                  )}
                </span>
              )}
              {task.place !== null && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" role="img" aria-label={labels.detail.fieldPlace} />
                  {placeText(task, placeDetail)}
                </span>
              )}
              {progress.total > 0 && (
                <span
                  className="inline-flex items-center gap-1"
                  role="img"
                  aria-label={labels.task.subtaskProgress(progress.done, progress.total)}
                >
                  <ListChecks className="size-3" aria-hidden="true" />
                  {progress.done}/{progress.total}
                </span>
              )}
              {projectName !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <ProjectDot color={projectColor} className="size-1.5" />
                  {projectName}
                </span>
              )}
              {task.description !== "" && <span className="basis-full truncate">{task.description}</span>}
            </span>
          )}
        </button>
        {done && (
          <Button variant="ghost" size="sm" className="self-center" onClick={() => void toggle(task)}>
            {labels.views.completed.restore}
          </Button>
        )}
      </div>
    </TaskContextMenu>
  )
}
