import { downloadDir, join } from "@tauri-apps/api/path"
import { mkdir, writeFile } from "@tauri-apps/plugin-fs"
import { isAndroid } from "@/lib/runtime"

export type SavedFile = { path: string | null }

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function saveToDownloadDir(blob: Blob, fileName: string): Promise<string> {
  const directory = await downloadDir()
  const path = await join(directory, fileName)
  await mkdir(directory, { recursive: true })
  await writeFile(path, new Uint8Array(await blob.arrayBuffer()))
  return path
}

export async function downloadBlob(blob: Blob, fileName: string): Promise<SavedFile> {
  if (isAndroid()) return { path: await saveToDownloadDir(blob, fileName) }
  triggerBrowserDownload(blob, fileName)
  return { path: null }
}
