import type { IsoDate, Task } from "@tickleaf/core"
import { Check, CircleCheckBig, Crosshair, SkipForward, X } from "lucide-react"
import { type KeyboardEvent, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useCountdown } from "@/hooks/use-countdown"
import { useTaskActions } from "@/hooks/use-task-actions"
import { dueWithTimeLabel } from "@/lib/format"
import { labels } from "@/lib/labels"
import { hasAnyModifier } from "@/lib/shortcuts"
import { DEFAULT_FOCUS_MINUTES, FocusTimer } from "./focus-timer"

type FocusSessionProps = {
  tasks: readonly Task[]
  today: IsoDate
  projectNameOf: (task: Task) => string | null
  onExit: () => void
}

type SessionCommand = "toggleTimer" | "complete" | "skip"

const SESSION_KEYS: Readonly<Record<string, SessionCommand>> = {
  " ": "toggleTimer",
  x: "complete",
  e: "complete",
  n: "skip",
}

const FULL_SCREEN_CLASSES =
  "top-0 left-0 flex h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col items-center gap-8 overflow-y-auto rounded-none border-0 p-6 shadow-none sm:max-w-none data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100"

function commandOf(event: KeyboardEvent): SessionCommand | null {
  if (hasAnyModifier(event)) return null
  const command = SESSION_KEYS[event.key.toLowerCase()] ?? null
  if (command === "toggleTimer" && event.target instanceof HTMLButtonElement) return null
  return command
}

function taskMeta(task: Task, today: IsoDate, projectName: string | null): string {
  const due = task.due === null ? null : dueWithTimeLabel({ ...task, due: task.due }, today)
  return [projectName, due].filter(Boolean).join(" · ")
}

type TaskFocusProps = { task: Task; today: IsoDate; projectName: string | null }

function TaskFocus({ task, today, projectName }: TaskFocusProps) {
  const meta = taskMeta(task, today, projectName)
  return (
    <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
      <h2 className="text-3xl font-semibold tracking-tight text-balance [overflow-wrap:anywhere]">{task.title}</h2>
      {task.description !== "" && (
        <p className="whitespace-pre-line text-muted-foreground [overflow-wrap:anywhere]">{task.description}</p>
      )}
      {meta !== "" && <p className="text-sm text-muted-foreground">{meta}</p>}
    </div>
  )
}

type SessionActionsProps = { onComplete: () => void; onSkip: () => void; onUnfocus: () => void }

function SessionActions({ onComplete, onSkip, onUnfocus }: SessionActionsProps) {
  const text = labels.focusSession
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button onClick={onComplete}>
        <Check />
        {text.complete}
      </Button>
      <Button variant="outline" onClick={onSkip}>
        <SkipForward />
        {text.skip}
      </Button>
      <Button variant="ghost" onClick={onUnfocus}>
        <Crosshair />
        {text.unfocus}
      </Button>
    </div>
  )
}

function AllDone({ onExit }: { onExit: () => void }) {
  const text = labels.focusSession
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <CircleCheckBig className="size-12 text-primary" aria-hidden="true" />
      <h2 className="text-3xl font-semibold tracking-tight">{text.allDone}</h2>
      <p className="text-muted-foreground">{text.allDoneDescription}</p>
      <Button onClick={onExit}>{text.quit}</Button>
    </div>
  )
}

function SessionHeader({ position, onExit }: { position: string | null; onExit: () => void }) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <span className="text-sm font-medium tabular-nums text-muted-foreground">{position}</span>
      <Button variant="ghost" size="sm" onClick={onExit}>
        <X />
        {labels.focusSession.quit}
      </Button>
    </div>
  )
}

function useSessionCursor(tasks: readonly Task[]) {
  const [index, setIndex] = useState(0)
  const position = tasks.length === 0 ? 0 : index % tasks.length
  return {
    position,
    current: tasks[position] ?? null,
    next: () => setIndex(position + 1),
  }
}

export function FocusSession({ tasks, today, projectNameOf, onExit }: FocusSessionProps) {
  const { toggle, focus } = useTaskActions()
  const [minutes, setMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const countdown = useCountdown(minutes * 60)
  const cursor = useSessionCursor(tasks)
  const contentRef = useRef<HTMLDivElement>(null)
  const current = cursor.current
  const text = labels.focusSession

  const changeMinutes = (next: number) => {
    setMinutes(next)
    countdown.reset(next * 60)
  }

  const complete = () => {
    if (current === null) return
    countdown.reset()
    void toggle(current)
  }

  const skip = () => {
    if (current === null) return
    countdown.reset()
    cursor.next()
  }

  const unfocus = () => {
    if (current === null) return
    countdown.reset()
    void focus(current, today)
  }

  const commands: Record<SessionCommand, () => void> = { toggleTimer: countdown.toggle, complete, skip }

  const runShortcut = (event: KeyboardEvent<HTMLDivElement>) => {
    const command = commandOf(event)
    if (command === null || current === null) return
    event.preventDefault()
    commands[command]()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onExit()}>
      <DialogContent
        ref={contentRef}
        showCloseButton={false}
        className={FULL_SCREEN_CLASSES}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          contentRef.current?.focus()
        }}
        onKeyDown={runShortcut}
      >
        <DialogTitle className="sr-only">{text.title}</DialogTitle>
        <DialogDescription className="sr-only">{text.description}</DialogDescription>
        <SessionHeader
          position={current === null ? null : text.position(cursor.position + 1, tasks.length)}
          onExit={onExit}
        />
        {current === null ? (
          <AllDone onExit={onExit} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-10">
            <TaskFocus task={current} today={today} projectName={projectNameOf(current)} />
            <FocusTimer countdown={countdown} minutes={minutes} onMinutesChange={changeMinutes} />
            <SessionActions onComplete={complete} onSkip={skip} onUnfocus={unfocus} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
