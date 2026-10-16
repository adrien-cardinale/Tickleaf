import { gcm } from "@noble/ciphers/aes.js"
import { hkdf } from "@noble/hashes/hkdf.js"
import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js"

export type Primitives = {
  sha256(bytes: Uint8Array): Promise<Uint8Array>
  hkdfSha256(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array>
  aesGcmEncrypt(key: Uint8Array, iv: Uint8Array, aad: Uint8Array, plain: Uint8Array): Promise<Uint8Array>
  aesGcmDecrypt(key: Uint8Array, iv: Uint8Array, aad: Uint8Array, sealed: Uint8Array): Promise<Uint8Array>
}

function subtle(): SubtleCrypto {
  const value = globalThis.crypto?.subtle
  if (!value) throw new Error("Web Crypto indisponible")
  return value
}

function buffer(bytes: Uint8Array): BufferSource {
  return bytes as BufferSource
}

function importAesKey(key: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  return subtle().importKey("raw", buffer(key), "AES-GCM", false, [usage])
}

export const webCryptoPrimitives: Primitives = {
  async sha256(bytes) {
    return new Uint8Array(await subtle().digest("SHA-256", buffer(bytes)))
  },
  async hkdfSha256(ikm, salt, info, length) {
    const key = await subtle().importKey("raw", buffer(ikm), "HKDF", false, ["deriveBits"])
    const bits = await subtle().deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: buffer(salt), info: buffer(info) },
      key,
      length * 8,
    )
    return new Uint8Array(bits)
  },
  async aesGcmEncrypt(key, iv, aad, plain) {
    const cipher = await subtle().encrypt(
      { name: "AES-GCM", iv: buffer(iv), additionalData: buffer(aad) },
      await importAesKey(key, "encrypt"),
      buffer(plain),
    )
    return new Uint8Array(cipher)
  },
  async aesGcmDecrypt(key, iv, aad, sealed) {
    const plain = await subtle().decrypt(
      { name: "AES-GCM", iv: buffer(iv), additionalData: buffer(aad) },
      await importAesKey(key, "decrypt"),
      buffer(sealed),
    )
    return new Uint8Array(plain)
  },
}

export const noblePrimitives: Primitives = {
  async sha256(bytes) {
    return nobleSha256(bytes)
  },
  async hkdfSha256(ikm, salt, info, length) {
    return hkdf(nobleSha256, ikm, salt, info, length)
  },
  async aesGcmEncrypt(key, iv, aad, plain) {
    return gcm(key, iv, aad).encrypt(plain)
  },
  async aesGcmDecrypt(key, iv, aad, sealed) {
    return gcm(key, iv, aad).decrypt(sealed)
  },
}

export function hasWebCrypto(): boolean {
  return typeof globalThis.crypto?.subtle?.digest === "function"
}

function active(): Primitives {
  return hasWebCrypto() ? webCryptoPrimitives : noblePrimitives
}

export const defaultPrimitives: Primitives = {
  sha256: (bytes) => active().sha256(bytes),
  hkdfSha256: (ikm, salt, info, length) => active().hkdfSha256(ikm, salt, info, length),
  aesGcmEncrypt: (key, iv, aad, plain) => active().aesGcmEncrypt(key, iv, aad, plain),
  aesGcmDecrypt: (key, iv, aad, sealed) => active().aesGcmDecrypt(key, iv, aad, sealed),
}

export const { sha256, hkdfSha256, aesGcmEncrypt, aesGcmDecrypt } = defaultPrimitives
