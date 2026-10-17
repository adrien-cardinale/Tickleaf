import { clearMasterKey } from "@/lib/crypto/key-store"
import { createPersistence, databaseEntry } from "@/lib/local-db/persistence"
import { createSerialQueue } from "@/lib/local-db/serial-queue"
import {
  type AccountIndex,
  activeAccount,
  type DeviceAccount,
  EMPTY_ACCOUNT_INDEX,
  type NewDeviceAccount,
  withAccountChange,
  withActive,
  withNewAccount,
  withoutAccount,
} from "./account-index"
import { loadStoredIndex, saveStoredIndex } from "./index-storage"
import { migrateLegacyAccount } from "./legacy-migration"

const queue = createSerialQueue()
let migration: Promise<void> | null = null

function ensureMigrated(): Promise<void> {
  migration ??= migrateLegacyAccount().catch((error: unknown) => {
    migration = null
    throw error
  })
  return migration
}

export async function readAccountIndex(): Promise<AccountIndex> {
  await ensureMigrated()
  return (await loadStoredIndex()) ?? EMPTY_ACCOUNT_INDEX
}

function updateAccountIndex(change: (index: AccountIndex) => AccountIndex): Promise<AccountIndex> {
  return queue(async () => {
    const next = change(await readAccountIndex())
    await saveStoredIndex(next)
    return next
  })
}

export async function getActiveAccount(): Promise<DeviceAccount | null> {
  return activeAccount(await readAccountIndex())
}

export async function setActiveAccount(id: string): Promise<void> {
  await updateAccountIndex((index) => withActive(index, id))
}

export async function addAndActivateAccount(account: NewDeviceAccount): Promise<void> {
  await updateAccountIndex((index) => withActive(withNewAccount(index, account), account.id))
}

export async function changeAccount(id: string, change: Partial<Omit<DeviceAccount, "id">>): Promise<void> {
  await updateAccountIndex((index) => withAccountChange(index, id, change))
}

export async function removeAccount(id: string): Promise<void> {
  await clearMasterKey(id)
  await createPersistence(databaseEntry(id)).remove()
  await updateAccountIndex((index) => withoutAccount(index, id))
}
