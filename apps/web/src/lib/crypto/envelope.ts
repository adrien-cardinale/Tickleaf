import { defaultPrimitives } from "./primitives"

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const FORMAT_VERSION = 1
const IV_BYTES = 12
const HEADER_BYTES = 1 + IV_BYTES
const AUTH_SECRET_BYTES = 32
const USER_ID_BYTES = 16
const AES_KEY_BYTES = 32
const HKDF_SALT = encoder.encode("tickleaf/v1")
const UNREADABLE = "Données illisibles : la clé ne correspond pas ou les données sont corrompues"

export type Credentials = {
  userId: string
  secret: string
}

export type Vault = {
  credentials: Credentials
  encrypt(plain: Uint8Array): Promise<Uint8Array>
  decrypt(sealed: Uint8Array): Promise<Uint8Array>
  encryptText(text: string): Promise<string>
  decryptText(sealed: string): Promise<string>
}

export function toBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

export function fromBase64(text: string): Uint8Array {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function deriveVault(masterKey: Uint8Array, primitives = defaultPrimitives): Promise<Vault> {
  const derive = (label: string, bytes: number) =>
    primitives.hkdfSha256(masterKey, HKDF_SALT, encoder.encode(label), bytes)
  const userId = toHex(await derive("user-id", USER_ID_BYTES))
  const secret = toBase64Url(await derive("auth-secret", AUTH_SECRET_BYTES))
  const aesKey = await derive("encryption", AES_KEY_BYTES)
  const additionalData = encoder.encode(`tickleaf/v${FORMAT_VERSION}/${userId}`)

  const encrypt = async (plain: Uint8Array): Promise<Uint8Array> => {
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
    const cipher = await primitives.aesGcmEncrypt(aesKey, iv, additionalData, plain)
    const sealed = new Uint8Array(HEADER_BYTES + cipher.length)
    sealed[0] = FORMAT_VERSION
    sealed.set(iv, 1)
    sealed.set(cipher, HEADER_BYTES)
    return sealed
  }

  const decrypt = async (sealed: Uint8Array): Promise<Uint8Array> => {
    if (sealed.length <= HEADER_BYTES || sealed[0] !== FORMAT_VERSION) throw new Error(UNREADABLE)
    const iv = sealed.slice(1, HEADER_BYTES)
    try {
      return await primitives.aesGcmDecrypt(aesKey, iv, additionalData, sealed.slice(HEADER_BYTES))
    } catch {
      throw new Error(UNREADABLE)
    }
  }

  return {
    credentials: { userId, secret },
    encrypt,
    decrypt,
    encryptText: async (text) => toBase64(await encrypt(encoder.encode(text))),
    decryptText: async (sealed) => decoder.decode(await decrypt(fromBase64(sealed))),
  }
}

export function isSealed(bytes: Uint8Array): boolean {
  return bytes.length > HEADER_BYTES && bytes[0] === FORMAT_VERSION
}
