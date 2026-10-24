import { addDays, type IsoDate, PRIORITIES, type Task } from "@tickleaf/core"
import { CalendarDays, Check, Flag, FolderInput, PanelRight, RotateCcw, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { ProjectDot } from "@/components/project-dot"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useWorkspace } from "@/components/workspace-context"
import { useTaskActions } from "@/hooks/use-task-actions"
import { labels } from "@/lib/labels"
import { useProjects } from "@/lib/queries"

type TaskContextMenuProps = {
  task: Task
  today: IsoDate
  children: ReactNode
}

export function TaskContextMenu({ task, today, children }: TaskContextMenuProps) {
  const { selectedTaskId, openTask, closeTask } = useWorkspace()
  const { toggle, update, remove } = useTaskActions()
  const { data: projects = [] } = useProjects()
  const text = labels.task.menu
  const done = task.completedAt !== null
  const dueOptions = [
    { label: labels.due.today, due: today },
    { label: labels.due.tomorrow, due: addDays(today, 1) },
    { label: text.noDue, due: null },
  ]

  const deleteTask = () => {
    if (selectedTaskId === task.id) closeTask()
    void remove(task.id)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => openTask(task.id)}>
          <PanelRight /> {text.open}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => void toggle(task)}>
          {done ? <RotateCcw /> : <Check />} {done ? text.reopen : text.complete}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <CalendarDays /> {text.due}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {dueOptions.map((option) => (
              <ContextMenuCheckboxItem
                key={option.label}
                checked={task.due === option.due}
                onSelect={() => void update(task.id, { due: option.due })}
              >
                {option.label}
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Flag /> {text.priority}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {PRIORITIES.map((priority) => (
              <ContextMenuCheckboxItem
                key={priority}
                checked={task.priority === priority}
                onSelect={() => void update(task.id, { priority })}
              >
                {labels.priority[priority]}
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput /> {text.project}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuCheckboxItem
              checked={task.projectId === null}
              onSelect={() => void update(task.id, { projectId: null })}
            >
              {labels.detail.inbox}
            </ContextMenuCheckboxItem>
            {projects.map((project) => (
              <ContextMenuCheckboxItem
                key={project.id}
                checked={task.projectId === project.id}
                onSelect={() => void update(task.id, { projectId: project.id })}
              >
                <ProjectDot color={project.color} />
                {project.name}
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={deleteTask}>
          <Trash2 /> {text.delete}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
