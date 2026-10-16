import { isStaticBuild } from "@/lib/runtime"

const STORAGE_KEY = "tickleaf.serverUrl"
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

function readStoredServerUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeServerUrl(serverUrl: string | null): void {
  if (!isStaticBuild()) return
  try {
    if (serverUrl === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, serverUrl)
  } catch {}
}

export function resolveServerUrl(): string | null {
  return isStaticBuild() ? readStoredServerUrl() : SAME_ORIGIN
}
