import { afterEach, describe, expect, test } from "bun:test"
import { deriveVault } from "./envelope"
import { formatMasterKey, generateMasterKey, parseMasterKey } from "./master-key"
import { hasWebCrypto, noblePrimitives, sha256, webCryptoPrimitives } from "./primitives"

const encoder = new TextEncoder()

describe("primitives", () => {
  test("WebCrypto est disponible dans les tests", () => {
    expect(hasWebCrypto()).toBe(true)
  })

  test("SHA-256, HKDF et AES-GCM donnent les mêmes octets dans les deux chemins", async () => {
    const key = generateMasterKey()
    const salt = encoder.encode("sel")
    const info = encoder.encode("info")
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const aad = encoder.encode("aad")
    const plain = encoder.encode("Arroser les plantes")
    expect(await noblePrimitives.sha256(plain)).toEqual(await webCryptoPrimitives.sha256(plain))
    expect(await noblePrimitives.hkdfSha256(key, salt, info, 42)).toEqual(
      await webCryptoPrimitives.hkdfSha256(key, salt, info, 42),
    )
    expect(await noblePrimitives.aesGcmEncrypt(key, iv, aad, plain)).toEqual(
      await webCryptoPrimitives.aesGcmEncrypt(key, iv, aad, plain),
    )
  })
})

describe("repli JavaScript", () => {
  test("même identifiant et même clé de récupération dans les deux chemins", async () => {
    const key = generateMasterKey()
    const web = await deriveVault(key, webCryptoPrimitives)
    const noble = await deriveVault(key, noblePrimitives)
    expect(noble.credentials).toEqual(web.credentials)
    const phrase = await formatMasterKey(key, webCryptoPrimitives)
    expect(await formatMasterKey(key, noblePrimitives)).toBe(phrase)
    expect(await parseMasterKey(phrase, noblePrimitives)).toEqual(key)
  })

  test("scellé avec WebCrypto s'ouvre avec noble, et l'inverse", async () => {
    const key = generateMasterKey()
    const web = await deriveVault(key, webCryptoPrimitives)
    const noble = await deriveVault(key, noblePrimitives)
    const plain = encoder.encode("héllo")
    expect(await noble.decrypt(await web.encrypt(plain))).toEqual(plain)
    expect(await web.decrypt(await noble.encrypt(plain))).toEqual(plain)
  })

  test("noble refuse des données altérées", async () => {
    const vault = await deriveVault(generateMasterKey(), noblePrimitives)
    const sealed = await vault.encrypt(new Uint8Array([1, 2, 3]))
    sealed[sealed.length - 1] = (sealed.at(-1) ?? 0) ^ 1
    await expect(vault.decrypt(sealed)).rejects.toThrow("illisibles")
  })
})

describe("contexte non sécurisé", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "crypto")

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, "crypto", original)
  })

  test("les primitives par défaut passent par noble sans crypto.subtle", async () => {
    const webPhrase = await formatMasterKey(new Uint8Array(32))
    const getRandomValues = crypto.getRandomValues.bind(crypto)
    Object.defineProperty(globalThis, "crypto", { value: { getRandomValues }, configurable: true })
    expect(hasWebCrypto()).toBe(false)
    expect(await sha256(new Uint8Array())).toHaveLength(32)
    expect(await formatMasterKey(new Uint8Array(32))).toBe(webPhrase)
    const vault = await deriveVault(generateMasterKey())
    expect(await vault.decryptText(await vault.encryptText("hors HTTPS"))).toBe("hors HTTPS")
  })
})
