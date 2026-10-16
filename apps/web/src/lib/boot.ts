import type { QueryClient } from "@tanstack/react-query"
import { todayIso } from "@tickleaf/core"
import { loadVault, wasKeyCreatedThisSession } from "@/lib/crypto/onboarding"
import { setLocalDatabase } from "@/lib/local-db/current-database"
import { openLocalDb } from "@/lib/local-db/open-local-db"
import { seedStarterData } from "@/lib/services/seed"
import { startSyncScheduler } from "@/lib/sync/sync-store"

let booted: Promise<void> | null = null

async function openDatabase(): Promise<void> {
  const database = await openLocalDb(await loadVault())
  if (database.isNew && wasKeyCreatedThisSession()) await database.run((db) => seedStarterData(db, todayIso()))
  setLocalDatabase(database)
}

export function bootApp(queryClient: QueryClient): Promise<void> {
  booted ??= openDatabase()
    .then(() => startSyncScheduler(queryClient))
    .catch((error: unknown) => {
      booted = null
      throw error
    })
  return booted
}
