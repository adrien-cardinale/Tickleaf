import { idbDelete, idbGet, idbSet } from "@/lib/local-db/idb"

export const LEGACY_KEY_ENTRY = "master-key"

function keyEntry(accountId: string): string {
  return `${LEGACY_KEY_ENTRY}:${accountId}`
}

export function loadMasterKey(accountId: string): Promise<Uint8Array | null> {
  return idbGet(keyEntry(accountId))
}

export function saveMasterKey(accountId: string, key: Uint8Array): Promise<void> {
  return idbSet(keyEntry(accountId), key)
}

export function clearMasterKey(accountId: string): Promise<void> {
  return idbDelete(keyEntry(accountId))
}
