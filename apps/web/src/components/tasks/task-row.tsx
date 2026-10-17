import type { IsoDate, Task } from "@tickleaf/core"
import { Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import { useTaskActions } from "@/hooks/use-task-actions"
import { dueLabel, recurrenceLabel } from "@/lib/format"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { PriorityCheck } from "./priority-check"

type TaskRowProps = {
  task: Task
  today: IsoDate
  projectName: string | null
}

function dueClass(task: Task, today: IsoDate): string {
  if (task.completedAt !== null || task.due === null) return ""
  if (task.due < today) return "text-red-600 dark:text-red-400"
  if (task.due === today) return "font-medium text-foreground"
  return ""
}

export function TaskRow({ task, today, projectName }: TaskRowProps) {
  const { selectedTaskId, openTask } = useWorkspace()
  const { toggle } = useTaskActions()
  const done = task.completedAt !== null
  const hasMeta = task.due !== null || projectName !== null || task.description !== ""

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b px-2 py-2.5 transition-colors hover:bg-muted/50",
        selectedTaskId === task.id && "bg-muted",
      )}
    >
      <PriorityCheck
        priority={task.priority}
        done={done}
        label={done ? labels.task.reopen(task.title) : labels.task.complete(task.title)}
        onToggle={() => void toggle(task)}
      />
      <button
        type="button"
        onClick={() => openTask(task.id)}
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
              <span className={cn("inline-flex items-center gap-1", dueClass(task, today))}>
                {dueLabel(task.due, today)}
                {task.recurrence !== null && (
                  <Repeat className="size-3" role="img" aria-label={recurrenceLabel(task.recurrence)} />
                )}
              </span>
            )}
            {projectName !== null && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full border border-current" aria-hidden="true" />
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
  )
}
