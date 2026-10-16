import type { IsoDate, Task } from "@tickleaf/core"
import type { ReactNode } from "react"
import { labels } from "@/lib/labels"
import { TaskRow } from "./task-row"

type TaskSectionProps = {
  title: string
  detail?: string
  badge?: ReactNode
  action?: ReactNode
  tasks: readonly Task[]
  today: IsoDate
  empty?: string
  projectNameOf: (task: Task) => string | null
}

export function TaskSection({ title, detail, badge, action, tasks, today, empty, projectNameOf }: TaskSectionProps) {
  return (
    <section className="flex flex-col">
      <h2 className="flex items-center gap-2 border-b pb-2 text-sm font-semibold tracking-tight">
        {title}
        {detail && <span className="font-normal text-muted-foreground">{detail}</span>}
        {badge}
        {action && <span className="ml-auto">{action}</span>}
      </h2>
      {tasks.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{empty ?? labels.views.emptySection}</p>
      ) : (
        tasks.map((task) => <TaskRow key={task.id} task={task} today={today} projectName={projectNameOf(task)} />)
      )}
    </section>
  )
}
