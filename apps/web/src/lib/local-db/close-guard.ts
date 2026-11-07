import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { isAndroid, isTauri } from "@/lib/runtime"
import { getLocalDatabase } from "./current-database"

const CLOSE_REQUESTED_EVENT = "tickleaf://close-requested"

let guarded = false

async function saveBeforeClose(): Promise<void> {
  try {
    await getLocalDatabase().flush()
  } catch (error) {
    console.error("Sauvegarde avant fermeture impossible", error)
  }
  await invoke("confirm_close")
}

export function guardWindowClose(): void {
  if (guarded || !isTauri() || isAndroid()) return
  guarded = true
  void listen(CLOSE_REQUESTED_EVENT, () => void saveBeforeClose()).catch(() => {
    guarded = false
  })
}
