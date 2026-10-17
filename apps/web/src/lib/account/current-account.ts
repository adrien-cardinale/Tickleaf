import type { DeviceAccount } from "./account-index"

let current: DeviceAccount | null = null

export function setCurrentAccount(account: DeviceAccount): void {
  current = account
}

export function getCurrentAccount(): DeviceAccount {
  if (!current) throw new Error("Compte non chargé")
  return current
}
