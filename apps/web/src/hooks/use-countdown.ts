import { useCallback, useEffect, useState } from "react"

const TICK_MS = 1000

type CountdownState = { endsAt: number | null; remainingMs: number }

export type Countdown = {
  remainingSeconds: number
  running: boolean
  finished: boolean
  start: () => void
  pause: () => void
  toggle: () => void
  reset: (seconds?: number) => void
}

function stopped(seconds: number): CountdownState {
  return { endsAt: null, remainingMs: seconds * 1000 }
}

function remainingAt(state: CountdownState, now: number): number {
  return state.endsAt === null ? state.remainingMs : Math.max(0, state.endsAt - now)
}

function useTicker(active: boolean, onTick: (now: number) => void): void {
  useEffect(() => {
    if (!active) return
    onTick(Date.now())
    const timer = window.setInterval(() => onTick(Date.now()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [active, onTick])
}

export function useCountdown(seconds: number): Countdown {
  const [state, setState] = useState(() => stopped(seconds))
  const [now, setNow] = useState(() => Date.now())
  const remainingMs = remainingAt(state, now)
  useTicker(state.endsAt !== null && remainingMs > 0, setNow)
  const running = state.endsAt !== null && remainingMs > 0

  const start = useCallback(() => {
    setState((current) => {
      if (current.endsAt !== null || current.remainingMs === 0) return current
      return { endsAt: Date.now() + current.remainingMs, remainingMs: current.remainingMs }
    })
  }, [])

  const pause = useCallback(() => {
    setState((current) => {
      if (current.endsAt === null) return current
      return { endsAt: null, remainingMs: remainingAt(current, Date.now()) }
    })
  }, [])

  const reset = useCallback((next: number = seconds) => setState(stopped(next)), [seconds])

  return {
    remainingSeconds: Math.ceil(remainingMs / 1000),
    running,
    finished: remainingMs === 0,
    start,
    pause,
    toggle: running ? pause : start,
    reset,
  }
}
