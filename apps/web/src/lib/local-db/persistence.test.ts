import { describe, expect, test } from "bun:test"
import { createAutoSaver, type Persistence } from "./persistence"

const DELAY_MS = 5
const RETRY_DELAY_MS = 10
const SETTLE_MS = 40

type FakePersistence = Persistence & { saved: Uint8Array[]; failuresLeft: number }

function fakePersistence(failures = 0): FakePersistence {
  const fake: FakePersistence = {
    saved: [],
    failuresLeft: failures,
    load: async () => fake.saved.at(-1) ?? null,
    save: async (bytes) => {
      if (fake.failuresLeft > 0) {
        fake.failuresLeft -= 1
        throw new Error("Écriture refusée")
      }
      fake.saved.push(bytes)
    },
    remove: async () => {
      fake.saved = []
    },
  }
  return fake
}

function saverFor(persistence: Persistence, errors: unknown[] = []) {
  return createAutoSaver({
    persistence,
    delayMs: DELAY_MS,
    retryDelayMs: RETRY_DELAY_MS,
    exportBytes: async () => new Uint8Array([1, 2, 3]),
    onError: (error) => errors.push(error),
  })
}

describe("createAutoSaver", () => {
  test("saves once after the debounce delay", async () => {
    const persistence = fakePersistence()
    const saver = saverFor(persistence)
    saver.schedule()
    saver.schedule()
    expect(persistence.saved).toHaveLength(0)
    await Bun.sleep(SETTLE_MS)
    expect(persistence.saved).toHaveLength(1)
  })

  test("retries after a failed save", async () => {
    const persistence = fakePersistence(1)
    const errors: unknown[] = []
    const saver = saverFor(persistence, errors)
    saver.schedule()
    await Bun.sleep(SETTLE_MS)
    expect(errors).toHaveLength(1)
    expect(persistence.saved).toHaveLength(1)
  })

  test("keeps retrying while the save fails", async () => {
    const persistence = fakePersistence(2)
    const errors: unknown[] = []
    const saver = saverFor(persistence, errors)
    saver.schedule()
    await Bun.sleep(SETTLE_MS * 2)
    expect(errors).toHaveLength(2)
    expect(persistence.saved).toHaveLength(1)
  })

  test("stops retrying after stop", async () => {
    const persistence = fakePersistence(1)
    const errors: unknown[] = []
    const saver = saverFor(persistence, errors)
    saver.schedule()
    await expect(saver.flush()).rejects.toThrow("Écriture refusée")
    await saver.stop()
    await Bun.sleep(SETTLE_MS)
    expect(errors).toHaveLength(1)
    expect(persistence.saved).toHaveLength(0)
  })
})
