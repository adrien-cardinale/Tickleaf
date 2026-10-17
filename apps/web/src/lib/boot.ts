import type { QueryClient } from "@tanstack/react-query"
import { todayIso } from "@tickleaf/core"
import { changeAccount } from "@/lib/account/accounts"
import { openActiveAccount } from "@/lib/crypto/onboarding"
import { setLocalDatabase } from "@/lib/local-db/current-database"
import { openLocalDb } from "@/lib/local-db/open-local-db"
import { seedStarterData } from "@/lib/services/seed"
import { startSyncScheduler } from "@/lib/sync/sync-store"

let booted: Promise<void> | null = null

async function openDatabase(): Promise<void> {
  const { account, vault } = await openActiveAccount()
  const database = await openLocalDb(account.id, vault)
  if (account.seedPending) {
    if (database.isNew) await database.run((db) => seedStarterData(db, todayIso()))
    await changeAccount(account.id, { seedPending: false })
  }
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
