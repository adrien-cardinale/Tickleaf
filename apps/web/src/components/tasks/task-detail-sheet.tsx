import { isPriority, PRIORITIES, type Project, type Section, type Task } from "@tickleaf/core"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspace } from "@/components/workspace-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTaskActions } from "@/hooks/use-task-actions"
import { formatTimestamp, fromDateTimeInput, toDateTimeInput } from "@/lib/format"
import { labels } from "@/lib/labels"
import { useProjects, useSections, useTasks } from "@/lib/queries"
import { ensureNotificationPermission } from "@/lib/reminders/reminder-notifications"
import { isTauri } from "@/lib/runtime"

const INBOX_VALUE = "inbox"
const NO_SECTION_VALUE = "none"

type TaskDetailFormProps = {
  task: Task
  projects: readonly Project[]
  sections: readonly Section[]
}

type SectionFieldProps = {
  task: Task
  sections: readonly Section[]
}

function SectionField({ task, sections }: SectionFieldProps) {
  const { update } = useTaskActions()
  const options = sections.filter((section) => section.projectId === task.projectId)
  if (options.length === 0) return null
  const current = options.some((section) => section.id === task.sectionId) ? task.sectionId : null

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="task-section" className="text-xs text-muted-foreground">
        {labels.detail.fieldSection}
      </Label>
      <Select
        value={current ?? NO_SECTION_VALUE}
        onValueChange={(value) => void update(task.id, { sectionId: value === NO_SECTION_VALUE ? null : value })}
      >
        <SelectTrigger id="task-section" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SECTION_VALUE}>{labels.detail.noSection}</SelectItem>
          {options.map((section) => (
            <SelectItem key={section.id} value={section.id}>
              {section.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

async function warnIfNotificationsBlocked(): Promise<void> {
  if (await ensureNotificationPermission()) return
  toast.error(labels.reminders.permissionDenied, { description: labels.reminders.permissionHint })
}

function ReminderField({ task }: { task: Task }) {
  const { update } = useTaskActions()

  const changeReminder = (value: string) => {
    const reminderAt = fromDateTimeInput(value)
    void update(task.id, { reminderAt })
    if (reminderAt !== null && isTauri()) void warnIfNotificationsBlocked()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="task-reminder" className="text-xs text-muted-foreground">
        {labels.detail.fieldReminder}
      </Label>
      <Input
        id="task-reminder"
        type="datetime-local"
        value={toDateTimeInput(task.reminderAt)}
        onChange={(event) => changeReminder(event.target.value)}
      />
      {!isTauri() && <p className="text-xs text-muted-foreground">{labels.detail.reminderWebHint}</p>}
    </div>
  )
}

function TaskDetailForm({ task, projects, sections }: TaskDetailFormProps) {
  const { update } = useTaskActions()
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
      <ReminderField task={task} />
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
      <SectionField task={task} sections={sections} />
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">{footnote}</span>
        <SheetClose asChild>
          <Button size="sm">{labels.detail.confirm}</Button>
        </SheetClose>
      </div>
    </div>
  )
}

export function TaskDetailSheet() {
  const { selectedTaskId, closeTask } = useWorkspace()
  const { remove } = useTaskActions()
  const { data: tasks = [] } = useTasks()
  const { data: projects = [] } = useProjects()
  const { data: sections = [] } = useSections()
  const isMobile = useIsMobile()
  const task = tasks.find((candidate) => candidate.id === selectedTaskId) ?? null

  const deleteTask = (id: string) => {
    closeTask()
    void remove(id)
  }

  return (
    <Sheet open={task !== null} onOpenChange={(open) => !open && closeTask()}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "gap-0" : "gap-0 sm:max-w-[360px]"}>
        <SheetHeader className="flex-row items-center justify-between gap-2 pr-12 pointer-coarse:pr-15">
          <SheetTitle className="tracking-tight">{labels.detail.title}</SheetTitle>
          <SheetDescription className="sr-only">{labels.detail.description}</SheetDescription>
          {task && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              title={labels.detail.delete}
              aria-label={labels.detail.delete}
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 />
            </Button>
          )}
        </SheetHeader>
        {task && <TaskDetailForm key={task.id} task={task} projects={projects} sections={sections} />}
      </SheetContent>
    </Sheet>
  )
}
