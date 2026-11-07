let current = new Date()
const listeners = new Set<() => void>()

export function currentArmingTime(): Date {
  return current
}

export function subscribeArmingClock(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function refreshArmingClock(): void {
  current = new Date()
  for (const listener of [...listeners]) listener()
}
