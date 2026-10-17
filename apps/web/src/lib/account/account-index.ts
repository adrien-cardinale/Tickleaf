import { z } from "zod"
import { labels } from "@/lib/labels"

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const deviceAccountSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{32}$/),
  label: z.string(),
  createdAt: z.string(),
  serverUrl: z.string().nullable(),
  seedPending: z.boolean(),
})

const accountIndexSchema = z.object({
  version: z.literal(1),
  activeId: z.string().nullable(),
  accounts: z.array(deviceAccountSchema),
})

export type DeviceAccount = z.infer<typeof deviceAccountSchema>
export type AccountIndex = z.infer<typeof accountIndexSchema>

export const EMPTY_ACCOUNT_INDEX: AccountIndex = { version: 1, activeId: null, accounts: [] }

export function parseAccountIndex(bytes: Uint8Array): AccountIndex {
  return accountIndexSchema.parse(JSON.parse(decoder.decode(bytes)))
}

export function serializeAccountIndex(index: AccountIndex): Uint8Array {
  return encoder.encode(JSON.stringify(index))
}

export function findAccount(index: AccountIndex, id: string): DeviceAccount | null {
  return index.accounts.find((account) => account.id === id) ?? null
}

export function activeAccount(index: AccountIndex): DeviceAccount | null {
  return index.activeId === null ? null : findAccount(index, index.activeId)
}

export function nextDefaultLabel(index: AccountIndex, format: (n: number) => string): string {
  const taken = new Set(index.accounts.map((account) => account.label))
  let n = 1
  while (taken.has(format(n))) n += 1
  return format(n)
}

export type NewDeviceAccount = Omit<DeviceAccount, "label" | "createdAt">

export function withNewAccount(index: AccountIndex, account: NewDeviceAccount, now = new Date()): AccountIndex {
  if (findAccount(index, account.id) !== null) return index
  const label = nextDefaultLabel(index, labels.accounts.defaultLabel)
  return { ...index, accounts: [...index.accounts, { ...account, label, createdAt: now.toISOString() }] }
}

export function withActive(index: AccountIndex, id: string): AccountIndex {
  return findAccount(index, id) === null ? index : { ...index, activeId: id }
}

export function withAccountChange(index: AccountIndex, id: string, change: Partial<DeviceAccount>): AccountIndex {
  return {
    ...index,
    accounts: index.accounts.map((account) => (account.id === id ? { ...account, ...change } : account)),
  }
}

export function withoutAccount(index: AccountIndex, id: string): AccountIndex {
  const accounts = index.accounts.filter((account) => account.id !== id)
  const activeId = index.activeId === id ? (accounts[0]?.id ?? null) : index.activeId
  return { ...index, activeId, accounts }
}
