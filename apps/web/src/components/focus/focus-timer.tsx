import { Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Countdown } from "@/hooks/use-countdown"
import { labels } from "@/lib/labels"

export const FOCUS_DURATIONS: readonly number[] = [15, 25, 45]
export const DEFAULT_FOCUS_MINUTES = 25

type FocusTimerProps = {
  countdown: Countdown
  minutes: number
  onMinutesChange: (minutes: number) => void
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function DurationPicker({ minutes, onMinutesChange }: Omit<FocusTimerProps, "countdown">) {
  const text = labels.focusSession
  return (
    <fieldset className="flex items-center gap-1">
      <legend className="sr-only">{text.durations}</legend>
      {FOCUS_DURATIONS.map((option) => (
        <Button
          key={option}
          variant={option === minutes ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={option === minutes}
          onClick={() => onMinutesChange(option)}
        >
          {text.minutes(option)}
        </Button>
      ))}
    </fieldset>
  )
}

function startLabel(countdown: Countdown, minutes: number): string {
  const text = labels.focusSession
  if (countdown.running) return text.pause
  return countdown.remainingSeconds < minutes * 60 ? text.resume : text.start
}

function TimerControls({ countdown, minutes }: Omit<FocusTimerProps, "onMinutesChange">) {
  const text = labels.focusSession
  return (
    <div className="flex items-center gap-2">
      <Button onClick={countdown.toggle} disabled={countdown.finished}>
        {countdown.running ? <Pause /> : <Play />}
        {startLabel(countdown, minutes)}
      </Button>
      <Button variant="ghost" size="icon" aria-label={text.reset} title={text.reset} onClick={() => countdown.reset()}>
        <RotateCcw />
      </Button>
    </div>
  )
}

export function FocusTimer({ countdown, minutes, onMinutesChange }: FocusTimerProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p role="timer" aria-label={labels.focusSession.timer} className="text-6xl font-semibold tabular-nums">
        {formatCountdown(countdown.remainingSeconds)}
      </p>
      <p aria-live="polite" className="h-5 text-sm font-medium text-primary">
        {countdown.finished ? labels.focusSession.timeUp : ""}
      </p>
      <DurationPicker minutes={minutes} onMinutesChange={onMinutesChange} />
      <TimerControls countdown={countdown} minutes={minutes} />
    </div>
  )
}
