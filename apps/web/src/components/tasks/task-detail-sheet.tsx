import { isPriority, PRIORITIES, type Project, type Task } from "@tickleaf/core"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspace } from "@/components/workspace-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTaskActions } from "@/hooks/use-task-actions"
import { formatTimestamp } from "@/lib/format"
import { labels } from "@/lib/labels"
import { useProjects, useTasks } from "@/lib/queries"

const INBOX_VALUE = "inbox"

type TaskDetailFormProps = {
  task: Task
  projects: readonly Project[]
  onDeleted: () => void
}

function TaskDetailForm({ task, projects, onDeleted }: TaskDetailFormProps) {
  const { update, remove } = useTaskActions()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const projectValue = task.projectId ?? INBOX_VALUE
  const footnote =
    task.completedAt !== null
      ? labels.detail.completed(formatTimestamp(task.completedAt))
      : labels.detail.created(formatTimestamp(task.createdAt))

  const changeTitle = (value: string) => {
    setTitle(value)
    void update(task.id, { title: value.trim() || labels.task.untitled })
  }

  const changeDescription = (value: string) => {
    setDescription(value)
    void update(task.id, { description: value })
  }

  const changePriority = (value: string) => {
    const priority = Number(value)
    if (isPriority(priority)) void update(task.id, { priority })
  }

  const deleteCurrent = () => {
    onDeleted()
    void remove(task.id)
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-title" className="text-xs text-muted-foreground">
          {labels.detail.fieldTitle}
        </Label>
        <Input id="task-title" value={title} onChange={(event) => changeTitle(event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-description" className="text-xs text-muted-foreground">
          {labels.detail.fieldDescription}
        </Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(event) => changeDescription(event.target.value)}
          placeholder={labels.detail.descriptionPlaceholder}
          className="min-h-[72px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="task-due" className="text-xs text-muted-foreground">
            {labels.detail.fieldDue}
          </Label>
          <Input
            id="task-due"
            type="date"
            value={task.due ?? ""}
            onChange={(event) => void update(task.id, { due: event.target.value || null })}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="task-priority" className="text-xs text-muted-foreground">
            {labels.detail.fieldPriority}
          </Label>
          <Select value={String(task.priority)} onValueChange={changePriority}>
            <SelectTrigger id="task-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={String(priority)}>
                  {labels.priority[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-project" className="text-xs text-muted-foreground">
          {labels.detail.fieldProject}
        </Label>
        <Select
          value={projectValue}
          onValueChange={(value) => void update(task.id, { projectId: value === INBOX_VALUE ? null : value })}
        >
          <SelectTrigger id="task-project" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={INBOX_VALUE}>{labels.detail.inbox}</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">{footnote}</span>
        <Button variant="outline" size="sm" className="text-destructive" onClick={deleteCurrent}>
          {labels.detail.delete}
        </Button>
      </div>
    </div>
  )
}

export function TaskDetailSheet() {
  const { selectedTaskId, closeTask } = useWorkspace()
  const { data: tasks = [] } = useTasks()
  const { data: projects = [] } = useProjects()
  const isMobile = useIsMobile()
  const task = tasks.find((candidate) => candidate.id === selectedTaskId) ?? null

  return (
    <Sheet open={task !== null} onOpenChange={(open) => !open && closeTask()}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "gap-0" : "gap-0 sm:max-w-[360px]"}>
        <SheetHeader>
          <SheetTitle className="tracking-tight">{labels.detail.title}</SheetTitle>
          <SheetDescription className="sr-only">{labels.detail.description}</SheetDescription>
        </SheetHeader>
        {task && <TaskDetailForm key={task.id} task={task} projects={projects} onDeleted={closeTask} />}
      </SheetContent>
    </Sheet>
  )
}
