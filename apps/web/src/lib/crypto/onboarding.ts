import type { DeviceAccount } from "@/lib/account/account-index"
import { addAndActivateAccount, getActiveAccount } from "@/lib/account/accounts"
import { getCurrentAccount, setCurrentAccount } from "@/lib/account/current-account"
import { setVault } from "./current-vault"
import { deriveVault, type Vault } from "./envelope"
import { loadMasterKey, saveMasterKey } from "./key-store"

export class KeyRequiredError extends Error {
  constructor() {
    super("Aucune clé de chiffrement sur cet appareil")
  }
}

export type OnboardingChoice = { key: Uint8Array; created: boolean; serverUrl: string | null }

export type OpenedAccount = { account: DeviceAccount; vault: Vault }

export async function openActiveAccount(): Promise<OpenedAccount> {
  const account = await getActiveAccount()
  if (account === null) throw new KeyRequiredError()
  const key = await loadMasterKey(account.id)
  if (key === null) throw new KeyRequiredError()
  const vault = await deriveVault(key)
  setCurrentAccount(account)
  setVault(vault)
  return { account, vault }
}

export async function readRecoveryKey(): Promise<Uint8Array> {
  const key = await loadMasterKey(getCurrentAccount().id)
  if (key === null) throw new KeyRequiredError()
  return key
}

export async function completeOnboarding({ key, created, serverUrl }: OnboardingChoice): Promise<void> {
  const { userId } = (await deriveVault(key)).credentials
  await saveMasterKey(userId, key)
  await addAndActivateAccount({ id: userId, serverUrl, seedPending: created })
}
