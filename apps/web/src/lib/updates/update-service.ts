import { getLocalDatabase } from "@/lib/local-db/current-database"
import { runtimeKind } from "@/lib/runtime"
import { fetchLatestRelease } from "./github-release"
import { isNewerVersion, stripVersionPrefix } from "./version"

export const APP_VERSION = stripVersionPrefix(__APP_VERSION__)

export type NativeChannel = "desktop" | "android"

export type ProgressListener = (ratio: number | null) => void

export type AvailableUpdate = {
  version: string
  notes: string
  install: ((onProgress: ProgressListener) => Promise<void>) | null
  downloadUrl: string | null
}

async function checkWithUpdater(): Promise<AvailableUpdate | null> {
  const { check } = await import("@tauri-apps/plugin-updater")
  const update = await check()
  if (!update) return null
  return {
    version: stripVersionPrefix(update.version),
    notes: update.body?.trim() ?? "",
    downloadUrl: null,
    install: async (onProgress) => {
      let total = 0
      let downloaded = 0
      // Sous Windows, l'installateur ferme l'application avant le retour de downloadAndInstall.
      await getLocalDatabase()
        .flush()
        .catch(() => undefined)
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0
          onProgress(total > 0 ? 0 : null)
        }
        if (event.event === "Progress") {
          downloaded += event.data.chunkLength
          onProgress(total > 0 ? downloaded / total : null)
        }
        if (event.event === "Finished") onProgress(1)
      })
      const { relaunch } = await import("@tauri-apps/plugin-process")
      await relaunch()
    },
  }
}

async function checkWithRelease(): Promise<AvailableUpdate | null> {
  const release = await fetchLatestRelease()
  if (!isNewerVersion(release.version, APP_VERSION)) return null
  return {
    version: release.version,
    notes: release.notes,
    install: null,
    downloadUrl: release.apkUrl ?? release.pageUrl,
  }
}

export function checkForNativeUpdate(channel: NativeChannel): Promise<AvailableUpdate | null> {
  return channel === "desktop" ? checkWithUpdater() : checkWithRelease()
}

export async function openExternalUrl(url: string): Promise<void> {
  if (runtimeKind() !== "web") {
    const { openUrl } = await import("@tauri-apps/plugin-opener")
    await openUrl(url)
    return
  }
  window.open(url, "_blank", "noopener,noreferrer")
}
