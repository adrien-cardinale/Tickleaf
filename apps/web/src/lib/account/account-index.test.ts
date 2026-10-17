import { describe, expect, test } from "bun:test"
import {
  activeAccount,
  EMPTY_ACCOUNT_INDEX,
  parseAccountIndex,
  serializeAccountIndex,
  withAccountChange,
  withActive,
  withNewAccount,
  withoutAccount,
} from "./account-index"

const FIRST = "a".repeat(32)
const SECOND = "b".repeat(32)
const NOW = new Date("2026-10-17T08:00:00.000Z")

function twoAccounts() {
  const first = withNewAccount(EMPTY_ACCOUNT_INDEX, { id: FIRST, serverUrl: null, seedPending: false }, NOW)
  return withActive(withNewAccount(first, { id: SECOND, serverUrl: "https://relay", seedPending: true }, NOW), FIRST)
}

describe("index des comptes", () => {
  test("numérote les noms par défaut sans doublon", () => {
    const index = twoAccounts()
    expect(index.accounts.map((account) => account.label)).toEqual(["Compte 1", "Compte 2"])
    expect(index.accounts[0]?.createdAt).toBe(NOW.toISOString())
  })

  test("ignore un compte déjà présent", () => {
    const index = twoAccounts()
    expect(withNewAccount(index, { id: FIRST, serverUrl: "https://other", seedPending: true })).toBe(index)
  })

  test("n'active qu'un compte connu", () => {
    const index = twoAccounts()
    expect(withActive(index, "c".repeat(32)).activeId).toBe(FIRST)
    expect(activeAccount(withActive(index, SECOND))?.id).toBe(SECOND)
  })

  test("passe au compte suivant quand le compte ouvert est retiré", () => {
    const index = withoutAccount(twoAccounts(), FIRST)
    expect(index.activeId).toBe(SECOND)
    expect(withoutAccount(index, SECOND).activeId).toBeNull()
  })

  test("modifie un seul compte", () => {
    const index = withAccountChange(twoAccounts(), SECOND, { label: "Travail" })
    expect(index.accounts.map((account) => account.label)).toEqual(["Compte 1", "Travail"])
  })

  test("relit l'index sérialisé", () => {
    const index = twoAccounts()
    expect(parseAccountIndex(serializeAccountIndex(index))).toEqual(index)
  })
})
