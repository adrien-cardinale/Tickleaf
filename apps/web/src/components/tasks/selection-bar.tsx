import { PRIORITIES, type Task } from "@tickleaf/core"
import { CalendarDays, Check, Flag, FolderInput, RotateCcw, Trash2, X } from "lucide-react"
import { type ReactNode, useEffect, useMemo } from "react"
import { ProjectDot } from "@/components/project-dot"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useWorkspace } from "@/components/workspace-context"
import { useSelectedTasks } from "@/hooks/use-selected-tasks"
import { useTaskActions } from "@/hooks/use-task-actions"
import { useToday } from "@/hooks/use-today"
import { dueOptions } from "@/lib/due-options"
import { labels } from "@/lib/labels"
import { useProjects, useTasks } from "@/lib/queries"
import type { TaskPatch } from "@/lib/services/tasks"

type MenuButtonProps = {
  icon: ReactNode
  label: string
  children: ReactNode
}

function ButtonLabel({ children }: { children: ReactNode }) {
  return <span className="max-lg:sr-only">{children}</span>
}

function MenuButton({ icon, label, children }: MenuButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {icon}
          <ButtonLabel>{label}</ButtonLabel>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function usePruneMissingSelection(): void {
  const { retainSelected } = useWorkspace()
  const { data: tasks } = useTasks()
  const presentIds = useMemo(() => new Set((tasks ?? []).map((task) => task.id)), [tasks])
  useEffect(() => {
    if (tasks !== undefined) retainSelected(presentIds)
  }, [tasks, presentIds, retainSelected])
}

function CompleteButton({ selected }: { selected: readonly Task[] }) {
  const { completeMany } = useTaskActions()
  const allDone = selected.every((task) => task.completedAt !== null)
  const text = labels.task.menu
  return (
    <Button variant="ghost" size="sm" onClick={() => void completeMany(selected)}>
      {allDone ? <RotateCcw /> : <Check />}
      <ButtonLabel>{allDone ? text.reopen : text.complete}</ButtonLabel>
    </Button>
  )
}

function PatchMenus({ ids }: { ids: readonly string[] }) {
  const { updateMany } = useTaskActions()
  const { data: projects = [] } = useProjects()
  const today = useToday()
  const text = labels.task.menu
  const patch = (value: TaskPatch) => void updateMany(ids, value)
  return (
    <>
      <MenuButton icon={<CalendarDays />} label={text.due}>
        {dueOptions(today).map((option) => (
          <DropdownMenuItem key={option.label} onSelect={() => patch({ due: option.due })}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </MenuButton>
      <MenuButton icon={<Flag />} label={text.priority}>
        {PRIORITIES.map((priority) => (
          <DropdownMenuItem key={priority} onSelect={() => patch({ priority })}>
            {labels.priority[priority]}
          </DropdownMenuItem>
        ))}
      </MenuButton>
      <MenuButton icon={<FolderInput />} label={text.project}>
        <DropdownMenuItem onSelect={() => patch({ projectId: null })}>{labels.detail.inbox}</DropdownMenuItem>
        {projects.map((project) => (
          <DropdownMenuItem key={project.id} onSelect={() => patch({ projectId: project.id })}>
            <ProjectDot color={project.color} />
            {project.name}
          </DropdownMenuItem>
        ))}
      </MenuButton>
    </>
  )
}

export function SelectionBar() {
  const { clearSelection } = useWorkspace()
  const { removeMany } = useTaskActions()
  const selected = useSelectedTasks()
  usePruneMissingSelection()
  if (selected.length === 0) return null
  const ids = selected.map((task) => task.id)
  return (
    <div
      role="toolbar"
      aria-label={labels.selection.toolbar}
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-lg border bg-popover p-1.5 text-sm text-popover-foreground shadow-lg"
    >
      <span className="px-2 font-medium tabular-nums whitespace-nowrap" aria-live="polite">
        {labels.selection.count(selected.length)}
      </span>
      <CompleteButton selected={selected} />
      <PatchMenus ids={ids} />
      <Button variant="destructive" size="sm" onClick={() => void removeMany(ids)}>
        <Trash2 />
        <ButtonLabel>{labels.task.menu.delete}</ButtonLabel>
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={clearSelection} aria-label={labels.selection.clear}>
        <X />
      </Button>
    </div>
  )
}
