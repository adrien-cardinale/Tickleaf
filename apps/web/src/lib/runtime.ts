import { fetch as tauriFetch } from "@tauri-apps/plugin-http"
import { platform } from "@tauri-apps/plugin-os"

export type RuntimeKind = "web" | "desktop" | "android"

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

export function isStaticBuild(): boolean {
  return import.meta.env.MODE === "static"
}

export function isDesktopBuild(): boolean {
  return import.meta.env.MODE === "desktop"
}

export function asksForServerUrl(): boolean {
  return isStaticBuild() || isDesktopBuild()
}

export function isAndroid(): boolean {
  return isTauri() && platform() === "android"
}

export function runtimeKind(): RuntimeKind {
  if (!isTauri()) return "web"
  return isAndroid() ? "android" : "desktop"
}

export function runtimeFetch(input: string, init?: RequestInit): Promise<Response> {
  return isTauri() ? tauriFetch(input, init) : fetch(input, init)
}
