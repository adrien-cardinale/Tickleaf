import { useEffect, useState } from "react"

const MINUTE_MS = 60_000

function delayToNextMinute(): number {
  return MINUTE_MS - (Date.now() % MINUTE_MS)
}

export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    let interval: number | undefined
    const timeout = window.setTimeout(() => {
      tick()
      interval = window.setInterval(tick, MINUTE_MS)
    }, delayToNextMinute())
    document.addEventListener("visibilitychange", tick)
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [])

  return now
}
