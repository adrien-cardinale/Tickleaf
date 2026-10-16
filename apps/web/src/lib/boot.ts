import { todayIso } from "@tickleaf/core"
import { setLocalDatabase } from "@/lib/local-db/current-database"
import { openLocalDb } from "@/lib/local-db/open-local-db"
import { seedStarterData } from "@/lib/services/seed"

let booted: Promise<void> | null = null

export function bootLocalDatabase(): Promise<void> {
  booted ??= (async () => {
    const database = await openLocalDb()
    if (database.isNew) await database.run((db) => seedStarterData(db, todayIso()))
    setLocalDatabase(database)
  })().catch((error: unknown) => {
    booted = null
    throw error
  })
  return booted
}
