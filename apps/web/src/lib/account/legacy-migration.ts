import { deriveVault } from "@/lib/crypto/envelope"
import { LEGACY_KEY_ENTRY, saveMasterKey } from "@/lib/crypto/key-store"
import { idbDelete, idbGet } from "@/lib/local-db/idb"
import { createPersistence, databaseEntry, LEGACY_DATABASE_ENTRY } from "@/lib/local-db/persistence"
import { EMPTY_ACCOUNT_INDEX, withActive, withNewAccount } from "./account-index"
import { loadStoredIndex, saveStoredIndex } from "./index-storage"

const LEGACY_SERVER_URL_KEY = "tickleaf.serverUrl"

function readLegacyServerUrl(): string | null {
  try {
    return localStorage.getItem(LEGACY_SERVER_URL_KEY)
  } catch {
    return null
  }
}

function clearLegacyServerUrl(): void {
  try {
    localStorage.removeItem(LEGACY_SERVER_URL_KEY)
  } catch {}
}

async function moveLegacyDatabase(accountId: string): Promise<void> {
  const legacy = createPersistence(LEGACY_DATABASE_ENTRY)
  const bytes = await legacy.load()
  if (bytes === null) return
  const target = createPersistence(databaseEntry(accountId))
  if ((await target.load()) === null) await target.save(bytes)
  await legacy.remove()
}

/** Les entrées de la version mono-compte sont recopiées avant d'être effacées : une interruption laisse toujours une copie lisible. */
export async function migrateLegacyAccount(): Promise<void> {
  const stored = await loadStoredIndex()
  const key = await idbGet(LEGACY_KEY_ENTRY)
  if (key === null) {
    if (stored === null) await saveStoredIndex(EMPTY_ACCOUNT_INDEX)
    return
  }
  const { userId } = (await deriveVault(key)).credentials
  await saveMasterKey(userId, key)
  await moveLegacyDatabase(userId)
  const index = withNewAccount(stored ?? EMPTY_ACCOUNT_INDEX, {
    id: userId,
    serverUrl: readLegacyServerUrl(),
    seedPending: false,
  })
  await saveStoredIndex(index.activeId === null ? withActive(index, userId) : index)
  await idbDelete(LEGACY_KEY_ENTRY)
  clearLegacyServerUrl()
}
