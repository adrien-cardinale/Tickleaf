import type { IsoDate, Task } from "@tickleaf/core"
import type { ReactNode } from "react"
import { useWorkspace } from "@/components/workspace-context"
import { labels } from "@/lib/labels"
import { SortableTaskList } from "./sortable-task-list"
import { BoardColumnList } from "./task-board"
import { TaskRow } from "./task-row"

type TaskSectionProps = {
  title: ReactNode
  detail?: string
  badge?: ReactNode
  action?: ReactNode
  tasks: readonly Task[]
  today: IsoDate
  empty?: string
  projectNameOf: (task: Task) => string | null
  footer?: ReactNode
  onReorder?: (orderedIds: string[]) => Promise<void> | void
  columnId?: string
}

type TaskListProps = Pick<TaskSectionProps, "tasks" | "today" | "empty" | "projectNameOf" | "onReorder" | "columnId">

function EmptySection({ text }: { text: string | undefined }) {
  return <p className="py-8 text-center text-muted-foreground">{text ?? labels.views.emptySection}</p>
}

function TaskList({ tasks, today, empty, projectNameOf, onReorder, columnId }: TaskListProps) {
  const { search } = useWorkspace()
  const sortable = search === ""
  if (columnId && sortable) {
    return (
      <BoardColumnList
        columnId={columnId}
        tasks={tasks}
        today={today}
        projectNameOf={projectNameOf}
        empty={<EmptySection text={empty} />}
      />
    )
  }
  if (tasks.length === 0) return <EmptySection text={empty} />
  if (onReorder && sortable) {
    return <SortableTaskList tasks={tasks} today={today} projectNameOf={projectNameOf} onReorder={onReorder} />
  }
  return tasks.map((task) => <TaskRow key={task.id} task={task} today={today} projectName={projectNameOf(task)} />)
}

export function TaskSection({
  title,
  detail,
  badge,
  action,
  tasks,
  today,
  empty,
  projectNameOf,
  footer,
  onReorder,
  columnId,
}: TaskSectionProps) {
  return (
    <section className="flex flex-col">
      <h2 className="flex items-center gap-2 border-b pb-2 text-sm font-semibold tracking-tight">
        {title}
        {detail && <span className="font-normal text-muted-foreground">{detail}</span>}
        {badge}
        {action && <span className="ml-auto">{action}</span>}
      </h2>
      <TaskList
        tasks={tasks}
        today={today}
        empty={empty}
        projectNameOf={projectNameOf}
        onReorder={onReorder}
        columnId={columnId}
      />
      {footer}
    </section>
  )
}
