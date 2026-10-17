import { getCurrentAccount } from "@/lib/account/current-account"
import { asksForServerUrl } from "@/lib/runtime"

const SAME_ORIGIN = ""

export function normalizeServerUrl(serverUrl: string): string {
  return serverUrl.trim().replace(/\/+$/, "")
}

export function parseServerUrl(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  try {
    const url = new URL(trimmed)
    return url.protocol === "http:" || url.protocol === "https:" ? normalizeServerUrl(trimmed) : null
  } catch {
    return null
  }
}

export function resolveServerUrl(): string | null {
  return asksForServerUrl() ? getCurrentAccount().serverUrl : SAME_ORIGIN
}
