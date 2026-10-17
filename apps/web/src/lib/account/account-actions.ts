import { getLocalDatabase } from "@/lib/local-db/current-database"
import { deleteServerAccount, stopSync } from "@/lib/sync/sync-store"
import { removeAccount, setActiveAccount } from "./accounts"
import { getCurrentAccount } from "./current-account"

export async function removeAccountFromDevice(): Promise<void> {
  await stopSync()
  await getLocalDatabase().erase()
  await removeAccount(getCurrentAccount().id)
  window.location.reload()
}

export async function deleteAccountEverywhere(): Promise<void> {
  await deleteServerAccount()
  await removeAccountFromDevice()
}

export async function reloadOnActiveAccount(): Promise<void> {
  await stopSync()
  await getLocalDatabase().flush()
  window.location.reload()
}

export async function switchAccount(id: string): Promise<void> {
  await setActiveAccount(id)
  await reloadOnActiveAccount()
}
