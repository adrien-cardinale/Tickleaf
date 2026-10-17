import { z } from "zod"
import { labels } from "@/lib/labels"
import { runtimeFetch } from "@/lib/runtime"
import { stripVersionPrefix } from "./version"

const REPOSITORY = "adrien-cardinale/Tickleaf"

export const RELEASES_PAGE_URL = `https://github.com/${REPOSITORY}/releases/latest`

const LATEST_RELEASE_API_URL = `https://api.github.com/repos/${REPOSITORY}/releases/latest`

const releaseSchema = z.object({
  tag_name: z.string(),
  html_url: z.string(),
  body: z.string().nullish(),
  assets: z.array(z.object({ name: z.string(), browser_download_url: z.string() })).default([]),
})

export type GithubRelease = {
  version: string
  notes: string
  pageUrl: string
  apkUrl: string | null
}

export async function fetchLatestRelease(): Promise<GithubRelease> {
  const response = await runtimeFetch(LATEST_RELEASE_API_URL, { headers: { Accept: "application/vnd.github+json" } })
  if (!response.ok) throw new Error(labels.settings.updates.releaseUnavailable)
  const parsed = releaseSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) throw new Error(labels.settings.updates.releaseUnavailable)
  const apk = parsed.data.assets.find((asset) => asset.name.endsWith(".apk"))
  return {
    version: stripVersionPrefix(parsed.data.tag_name),
    notes: parsed.data.body?.trim() ?? "",
    pageUrl: parsed.data.html_url,
    apkUrl: apk?.browser_download_url ?? null,
  }
}
