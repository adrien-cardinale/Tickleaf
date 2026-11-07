import { z } from "zod"
import { isTauri, runtimeFetch } from "@/lib/runtime"
import { stripVersionPrefix } from "@/lib/updates/version"

export type GeocodeResult = { label: string; latitude: number; longitude: number }

const SEARCH_ENDPOINT = "https://nominatim.openstreetmap.org/search"
const RESULT_LIMIT = 5
const REPOSITORY_URL = "https://github.com/adrien-cardinale/Tickleaf"

const coordinate = z.string().trim().min(1).transform(Number).pipe(z.number())

const nominatimEntry = z.object({
  display_name: z.string().trim().min(1),
  lat: coordinate.pipe(z.number().min(-90).max(90)),
  lon: coordinate.pipe(z.number().min(-180).max(180)),
})

export function geocodeUrl(query: string): string {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: String(RESULT_LIMIT),
    "accept-language": "fr",
    q: query.trim(),
  })
  return `${SEARCH_ENDPOINT}?${params.toString()}`
}

export function parseGeocodeResponse(json: unknown): GeocodeResult[] {
  if (!Array.isArray(json)) return []
  return json.flatMap((entry) => {
    const parsed = nominatimEntry.safeParse(entry)
    if (!parsed.success) return []
    return [{ label: parsed.data.display_name, latitude: parsed.data.lat, longitude: parsed.data.lon }]
  })
}

function requestHeaders(): HeadersInit | undefined {
  if (!isTauri()) return undefined
  return { "User-Agent": `Tickleaf/${stripVersionPrefix(__APP_VERSION__)} (${REPOSITORY_URL})` }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  if (query.trim() === "") return []
  const response = await runtimeFetch(geocodeUrl(query), { headers: requestHeaders(), signal })
  if (!response.ok) throw new Error(`Nominatim responded ${response.status}`)
  return parseGeocodeResponse(await response.json())
}
