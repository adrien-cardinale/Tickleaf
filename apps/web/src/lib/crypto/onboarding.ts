import { storeServerUrl } from "@/lib/sync/server-url"
import { setVault } from "./current-vault"
import { deriveVault, type Vault } from "./envelope"
import { loadMasterKey, saveMasterKey } from "./key-store"

export class KeyRequiredError extends Error {
  constructor() {
    super("Aucune clé de chiffrement sur cet appareil")
  }
}

export type OnboardingChoice = { key: Uint8Array; created: boolean; serverUrl: string | null }

let keyCreatedThisSession = false

export async function loadVault(): Promise<Vault> {
  const key = await loadMasterKey()
  if (key === null) throw new KeyRequiredError()
  const vault = await deriveVault(key)
  setVault(vault)
  return vault
}

export async function readRecoveryKey(): Promise<Uint8Array> {
  const key = await loadMasterKey()
  if (key === null) throw new KeyRequiredError()
  return key
}

export function wasKeyCreatedThisSession(): boolean {
  return keyCreatedThisSession
}

export async function completeOnboarding({ key, created, serverUrl }: OnboardingChoice): Promise<void> {
  storeServerUrl(serverUrl)
  await saveMasterKey(key)
  keyCreatedThisSession = created
}
