import { useNavigate } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import { useWorkspace } from "@/components/workspace-context"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  CHORD_PREFIX,
  CHORD_TIMEOUT_MS,
  type GoToPath,
  goToShortcuts,
  hasAnyModifier,
  isInsideOverlay,
  isModifierKey,
  isTaskRow,
  isTypingTarget,
  QUICK_ADD_INPUT_ID,
  SEARCH_INPUT_ID,
  TASK_ROW_ATTRIBUTE,
} from "@/lib/shortcuts"

type Step = 1 | -1

const NEXT_KEYS = new Set(["j", "ArrowDown"])
const PREVIOUS_KEYS = new Set(["k", "ArrowUp"])
const ARROW_KEYS = new Set(["ArrowDown", "ArrowUp"])

function focusInput(id: string): void {
  const input = document.getElementById(id)
  if (!(input instanceof HTMLInputElement)) return
  input.focus()
}

function visibleTaskRows(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[${TASK_ROW_ATTRIBUTE}]`)).filter(
    (row) => row.getClientRects().length > 0,
  )
}

function nextRowIndex(current: number, step: Step, count: number): number {
  if (current === -1) return step === 1 ? 0 : count - 1
  return Math.min(Math.max(current + step, 0), count - 1)
}

function moveTaskFocus(step: Step): boolean {
  const rows = visibleTaskRows()
  if (rows.length === 0) return false
  const current = rows.indexOf(document.activeElement as HTMLElement)
  const row = rows[nextRowIndex(current, step, rows.length)]
  row?.focus({ preventScroll: true })
  row?.scrollIntoView({ block: "nearest" })
  return true
}

function canUseArrows(target: EventTarget | null): boolean {
  return isTaskRow(target) || target === document.body
}

function goToPath(key: string): GoToPath | null {
  return goToShortcuts.find((shortcut) => shortcut.key === key)?.to ?? null
}

export function useKeyboardShortcuts(): void {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { openShortcuts } = useWorkspace()
  const chordStartedAt = useRef<number | null>(null)

  useEffect(() => {
    if (isMobile) return

    const takeChord = (): boolean => {
      const startedAt = chordStartedAt.current
      chordStartedAt.current = null
      return startedAt !== null && performance.now() - startedAt < CHORD_TIMEOUT_MS
    }

    const completeChord = (event: KeyboardEvent): void => {
      const to = goToPath(event.key)
      if (to === null) return
      event.preventDefault()
      void navigate({ to })
    }

    const moveFocus = (event: KeyboardEvent, step: Step): void => {
      if (ARROW_KEYS.has(event.key) && !canUseArrows(event.target)) return
      if (moveTaskFocus(step)) event.preventDefault()
    }

    const handlePlainKey = (event: KeyboardEvent): void => {
      if (event.key === CHORD_PREFIX) chordStartedAt.current = performance.now()
      else if (event.key === "/") {
        event.preventDefault()
        focusInput(QUICK_ADD_INPUT_ID)
      } else if (event.key === "?") {
        event.preventDefault()
        openShortcuts()
      } else if (NEXT_KEYS.has(event.key)) moveFocus(event, 1)
      else if (PREVIOUS_KEYS.has(event.key)) moveFocus(event, -1)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || isInsideOverlay(event.target)) return
      if (isModifierKey(event) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        focusInput(SEARCH_INPUT_ID)
        return
      }
      if (hasAnyModifier(event) || isTypingTarget(event.target)) return
      if (takeChord()) completeChord(event)
      else handlePlainKey(event)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isMobile, navigate, openShortcuts])
}
