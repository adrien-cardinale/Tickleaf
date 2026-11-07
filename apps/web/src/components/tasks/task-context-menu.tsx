import { type IsoDate, PRIORITIES, type Task } from "@tickleaf/core"
import {
  CalendarDays,
  Check,
  Flag,
  FolderInput,
  PanelRight,
  RotateCcw,
  SquareCheck,
  SquareDashed,
  Trash2,
} from "lucide-react"
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
import { useMenuTargets } from "@/hooks/use-selected-tasks"
import { useTaskActions } from "@/hooks/use-task-actions"
import { dueOptions } from "@/lib/due-options"
import { labels } from "@/lib/labels"
import { useProjects } from "@/lib/queries"
import type { TaskPatch } from "@/lib/services/tasks"

type TaskContextMenuProps = {
  task: Task
  today: IsoDate
  children: ReactNode
}

function useMenuActions(task: Task) {
  const { selectedTaskId, closeTask } = useWorkspace()
  const { toggle, update, remove, updateMany, completeMany, removeMany } = useTaskActions()
  const targets = useMenuTargets(task)
  const grouped = targets.length > 1
  const ids = targets.map((target) => target.id)

  return {
    targets,
    complete: () => void (grouped ? completeMany(targets) : toggle(task)),
    patch: (patch: TaskPatch) => void (grouped ? updateMany(ids, patch) : update(task.id, patch)),
    remove: () => {
      if (grouped) {
        void removeMany(ids)
        return
      }
      if (selectedTaskId === task.id) closeTask()
      void remove(task.id)
    },
  }
}

export function TaskContextMenu({ task, today, children }: TaskContextMenuProps) {
  const { openTask, selectedIds, toggleSelected } = useWorkspace()
  const { targets, complete, patch, remove } = useMenuActions(task)
  const { data: projects = [] } = useProjects()
  const text = labels.task.menu
  const done = targets.every((target) => target.completedAt !== null)
  const selected = selectedIds.has(task.id)
  const allMatch = (matches: (target: Task) => boolean) => targets.every(matches)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => toggleSelected(task.id)}>
          {selected ? <SquareDashed /> : <SquareCheck />} {selected ? text.deselect : text.select}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => openTask(task.id)}>
          <PanelRight /> {text.open}
        </ContextMenuItem>
        <ContextMenuItem onSelect={complete}>
          {done ? <RotateCcw /> : <Check />} {done ? text.reopen : text.complete}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <CalendarDays /> {text.due}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {dueOptions(today).map((option) => (
              <ContextMenuCheckboxItem
                key={option.label}
                checked={allMatch((target) => target.due === option.due)}
                onSelect={() => patch({ due: option.due })}
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
                checked={allMatch((target) => target.priority === priority)}
                onSelect={() => patch({ priority })}
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
              checked={allMatch((target) => target.projectId === null)}
              onSelect={() => patch({ projectId: null })}
            >
              {labels.detail.inbox}
            </ContextMenuCheckboxItem>
            {projects.map((project) => (
              <ContextMenuCheckboxItem
                key={project.id}
                checked={allMatch((target) => target.projectId === project.id)}
                onSelect={() => patch({ projectId: project.id })}
              >
                <ProjectDot color={project.color} />
                {project.name}
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={remove}>
          <Trash2 /> {text.delete}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
