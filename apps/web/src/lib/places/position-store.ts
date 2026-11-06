import { type PositionReading, readCurrentPosition } from "./position"

export type PositionState = PositionReading | { status: "pending" }

const PENDING: PositionState = { status: "pending" }

let current: PositionState = PENDING
let inFlight: Promise<PositionReading> | null = null
const listeners = new Set<() => void>()

export function currentPosition(): PositionState {
  return current
}

export function subscribePosition(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function readAndPublish(): Promise<PositionReading> {
  const reading = await readCurrentPosition()
  current = reading
  for (const listener of listeners) listener()
  return reading
}

export function refreshPosition(): Promise<PositionReading> {
  inFlight ??= readAndPublish().finally(() => {
    inFlight = null
  })
  return inFlight
}
