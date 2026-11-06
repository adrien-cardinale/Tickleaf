import { checkPermissions, getCurrentPosition, requestPermissions } from "@tauri-apps/plugin-geolocation"
import type { Position } from "@tickleaf/core"
import { isAndroid, isTauri } from "@/lib/runtime"

export type PositionReading =
  | { status: "located"; position: Position }
  | { status: "denied" }
  | { status: "unavailable" }

const POSITION_OPTIONS = { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }

const UNAVAILABLE: PositionReading = { status: "unavailable" }
const DENIED: PositionReading = { status: "denied" }

function located(coords: { latitude: number; longitude: number }): PositionReading {
  return { status: "located", position: { latitude: coords.latitude, longitude: coords.longitude } }
}

function hasBrowserGeolocation(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator
}

export function canReadPosition(): boolean {
  return isAndroid() || (!isTauri() && hasBrowserGeolocation())
}

async function hasAndroidPermission(): Promise<boolean> {
  if ((await checkPermissions()).location === "granted") return true
  return (await requestPermissions(["location"])).location === "granted"
}

async function readOnAndroid(): Promise<PositionReading> {
  try {
    if (!(await hasAndroidPermission())) return DENIED
    return located((await getCurrentPosition(POSITION_OPTIONS)).coords)
  } catch {
    return UNAVAILABLE
  }
}

function readInBrowser(): Promise<PositionReading> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (reading) => resolve(located(reading.coords)),
      (error) => resolve(error.code === error.PERMISSION_DENIED ? DENIED : UNAVAILABLE),
      POSITION_OPTIONS,
    )
  })
}

export function readCurrentPosition(): Promise<PositionReading> {
  if (isAndroid()) return readOnAndroid()
  if (canReadPosition()) return readInBrowser()
  return Promise.resolve(UNAVAILABLE)
}
