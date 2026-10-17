import { idbGet, idbSet } from "@/lib/local-db/idb"
import { type AccountIndex, parseAccountIndex, serializeAccountIndex } from "./account-index"

const INDEX_ENTRY = "accounts"

export async function loadStoredIndex(): Promise<AccountIndex | null> {
  const bytes = await idbGet(INDEX_ENTRY)
  return bytes === null ? null : parseAccountIndex(bytes)
}

export function saveStoredIndex(index: AccountIndex): Promise<void> {
  return idbSet(INDEX_ENTRY, serializeAccountIndex(index))
}
