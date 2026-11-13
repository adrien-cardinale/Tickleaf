import {
  isFocused,
  isPriority,
  isReminderPast,
  localDueTime,
  PRIORITIES,
  type Project,
  RECURRENCE_UNITS,
  REMINDER_OFFSETS,
  type Recurrence,
  type RecurrenceUnit,
  reminderAtFor,
  reminderOffset,
  type Section,
  subtaskProgress,
  type Task,
} from "@tickleaf/core"
import { Trash2, X } from "lucide-react"
import { type ComponentProps, type FormEvent, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspace } from "@/components/workspace-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTaskActions } from "@/hooks/use-task-actions"
import { useToday } from "@/hooks/use-today"
import { foreignDueTimeZone, formatDateTime, formatTimestamp, recurrenceLabel } from "@/lib/format"
import { labels } from "@/lib/labels"
import { useProjects, useSections, useSubtasks, useTasks } from "@/lib/queries"
import { ensureNotificationPermission } from "@/lib/reminders/reminder-notifications"
import { isTauri } from "@/lib/runtime"
import { deviceTimeZone } from "@/lib/services/clock"
import { cn } from "@/lib/utils"
import { PlaceField } from "./place-field"

const INBOX_VALUE = "inbox"
const NO_SECTION_VALUE = "none"
const NO_RECURRENCE_VALUE = "none"
const RECURRENCE_PRESETS: readonly Recurrence[] = RECURRENCE_UNITS.map((unit) => ({ unit, interval: 1 }))

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

function SubtaskItem({ subtask }: { subtask: Task }) {
  const { update, toggleSubtask, remove } = useTaskActions()
  const [title, setTitle] = useState(subtask.title)
  const done = subtask.completedAt !== null

  const changeTitle = (value: string) => {
    setTitle(value)
    void update(subtask.id, { title: value.trim() || labels.task.untitled })
  }

  return (
    <li className="flex items-center gap-2">
      <Checkbox
        checked={done}
        onCheckedChange={() => void toggleSubtask(subtask)}
        aria-label={done ? labels.task.reopen(subtask.title) : labels.task.complete(subtask.title)}
      />
      <Input
        value={title}
        onChange={(event) => changeTitle(event.target.value)}
        aria-label={labels.detail.subtaskTitle}
        className={cn("h-8 border-transparent px-1.5 shadow-none", done && "text-muted-foreground line-through")}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        title={labels.detail.deleteSubtask(subtask.title)}
        aria-label={labels.detail.deleteSubtask(subtask.title)}
        onClick={() => void remove(subtask.id)}
      >
        <X />
      </Button>
    </li>
  )
}

function SubtasksField({ task }: { task: Task }) {
  const { addSubtask } = useTaskActions()
  const { data: subtasks = [] } = useSubtasks(task.id)
  const [draft, setDraft] = useState("")
  const progress = subtaskProgress(subtasks)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const title = draft.trim()
    if (title === "") return
    setDraft("")
    void addSubtask(task.id, title)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="task-subtask-new" className="text-xs text-muted-foreground">
        {labels.detail.fieldSubtasks}
        {progress.total > 0 && (
          <span>
            {progress.done}/{progress.total}
          </span>
        )}
      </Label>
      {subtasks.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {subtasks.map((subtask) => (
            <SubtaskItem key={subtask.id} subtask={subtask} />
          ))}
        </ul>
      )}
      <form onSubmit={submit}>
        <Input
          id="task-subtask-new"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={labels.detail.subtaskPlaceholder}
        />
      </form>
    </div>
  )
}

function recurrenceValue(recurrence: Recurrence): string {
  return `${recurrence.interval}:${recurrence.unit}`
}

function parseRecurrenceValue(value: string): Recurrence | null {
  const [interval, unit] = value.split(":")
  if (!(RECURRENCE_UNITS as readonly string[]).includes(unit ?? "")) return null
  return { unit: unit as RecurrenceUnit, interval: Number(interval) }
}

function RecurrenceField({ task }: { task: Task }) {
  const { update } = useTaskActions()
  const today = useToday()
  const current = task.recurrence
  const options = current === null || current.interval === 1 ? RECURRENCE_PRESETS : [...RECURRENCE_PRESETS, current]

  const changeRecurrence = (value: string) => {
    const recurrence = parseRecurrenceValue(value)
    void update(task.id, recurrence !== null && task.due === null ? { recurrence, due: today } : { recurrence })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="task-recurrence" className="text-xs text-muted-foreground">
        {labels.detail.fieldRecurrence}
      </Label>
      <Select
        value={current === null ? NO_RECURRENCE_VALUE : recurrenceValue(current)}
        onValueChange={changeRecurrence}
      >
        <SelectTrigger id="task-recurrence" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_RECURRENCE_VALUE}>{labels.recurrence.none}</SelectItem>
          {options.map((option) => (
            <SelectItem key={recurrenceValue(option)} value={recurrenceValue(option)}>
              {recurrenceLabel(option)}
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

const NO_REMINDER_VALUE = "none"
const CUSTOM_REMINDER_VALUE = "custom"

function reminderValue(task: Task): string {
  if (task.reminderAt === null) return NO_REMINDER_VALUE
  const offset = reminderOffset(task)
  const isPreset = offset !== null && (REMINDER_OFFSETS as readonly number[]).includes(offset)
  return isPreset ? String(offset) : CUSTOM_REMINDER_VALUE
}

function isOffsetAvailable(task: Task, offset: number, now: Date): boolean {
  const reminderAt = reminderAtFor(task, offset)
  return reminderAt !== null && !isReminderPast(reminderAt, now)
}

function ReminderField({ task }: { task: Task }) {
  const { update } = useTaskActions()
  const value = reminderValue(task)
  const now = new Date()
  const offsets = task.dueTime === null ? [] : REMINDER_OFFSETS

  const changeReminder = (selected: string) => {
    if (selected === CUSTOM_REMINDER_VALUE) return
    const reminderAt = selected === NO_REMINDER_VALUE ? null : reminderAtFor(task, Number(selected))
    void update(task.id, { reminderAt })
    if (reminderAt !== null && isTauri()) void warnIfNotificationsBlocked()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="task-reminder" className="text-xs text-muted-foreground">
        {labels.detail.fieldReminder}
      </Label>
      <Select value={value} onValueChange={changeReminder}>
        <SelectTrigger id="task-reminder" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_REMINDER_VALUE}>{labels.detail.reminderNone}</SelectItem>
          {offsets.map((offset) => (
            <SelectItem key={offset} value={String(offset)} disabled={!isOffsetAvailable(task, offset, now)}>
              {labels.detail.reminderBefore(offset)}
            </SelectItem>
          ))}
          {value === CUSTOM_REMINDER_VALUE && task.reminderAt !== null && (
            <SelectItem value={CUSTOM_REMINDER_VALUE}>
              {labels.detail.reminderCustom(formatDateTime(task.reminderAt))}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {task.reminderAt !== null && isReminderPast(task.reminderAt, now) && (
        <p className="text-xs text-muted-foreground">{labels.detail.reminderPast}</p>
      )}
      {!isTauri() && <p className="text-xs text-muted-foreground">{labels.detail.reminderWebHint}</p>}
    </div>
  )
}

type CommittedInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur"> & {
  value: string
  onCommit: (value: string | null) => void
}

function CommittedInput({ value, onCommit, ...props }: CommittedInputProps) {
  const [draft, setDraft] = useState(value)
  const [saved, setSaved] = useState(value)
  if (value !== saved) {
    setSaved(value)
    setDraft(value)
  }

  return (
    <Input
      {...props}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value)
        if (event.target.value !== "") onCommit(event.target.value)
      }}
      onBlur={() => {
        if (draft === "" && value !== "") onCommit(null)
      }}
    />
  )
}

function DueTimeField({ task }: { task: Task }) {
  const { update } = useTaskActions()
  const savedZone = foreignDueTimeZone(task, deviceTimeZone())

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="task-due-time" className="text-xs text-muted-foreground">
        {labels.detail.fieldDueTime}
      </Label>
      <div className="flex items-center gap-2">
        <CommittedInput
          id="task-due-time"
          type="time"
          value={localDueTime(task) ?? ""}
          onCommit={(dueTime) => void update(task.id, { dueTime })}
        />
        {task.dueTime !== null && (
          <Button
            variant="ghost"
            size="icon-sm"
            title={labels.detail.clearDueTime}
            aria-label={labels.detail.clearDueTime}
            onClick={() => void update(task.id, { dueTime: null })}
          >
            <X />
          </Button>
        )}
      </div>
      {savedZone !== null && task.dueTime !== null && (
        <p className="text-xs text-muted-foreground">{labels.detail.dueTimeSavedIn(task.dueTime, savedZone)}</p>
      )}
    </div>
  )
}

function FocusField({ task }: { task: Task }) {
  const { focus } = useTaskActions()
  const today = useToday()
  if (task.completedAt !== null || task.parentId !== null) return null

  return (
    <div className="flex items-center gap-2">
      <Checkbox id="task-focus" checked={isFocused(task, today)} onCheckedChange={() => void focus(task, today)} />
      <Label htmlFor="task-focus" className="text-sm font-normal">
        {labels.detail.focusToday}
      </Label>
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
      {task.parentId === null && <SubtasksField task={task} />}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="task-due" className="text-xs text-muted-foreground">
            {labels.detail.fieldDue}
          </Label>
          <CommittedInput
            id="task-due"
            type="date"
            value={task.due ?? ""}
            onCommit={(due) => void update(task.id, { due })}
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
      <FocusField task={task} />
      {task.due !== null && <DueTimeField task={task} />}
      {(task.dueTime !== null || task.reminderAt !== null) && <ReminderField task={task} />}
      <RecurrenceField task={task} />
      <PlaceField task={task} />
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
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "gap-0" : "gap-0 overflow-y-auto sm:max-w-[360px]"}
      >
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
