import { idbDelete, idbGet, idbSet } from "@/lib/local-db/idb"

const KEY_ENTRY = "master-key"

export function loadMasterKey(): Promise<Uint8Array | null> {
  return idbGet(KEY_ENTRY)
}

export function saveMasterKey(key: Uint8Array): Promise<void> {
  return idbSet(KEY_ENTRY, key)
}

export function clearMasterKey(): Promise<void> {
  return idbDelete(KEY_ENTRY)
}
