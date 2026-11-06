import { labels } from "@/lib/labels"

const METERS_PER_KILOMETER = 1_000

const meterFormat = new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 0 })
const kilometerFormat = new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 1 })

export function formatDistance(meters: number): string {
  const rounded = Math.round(meters)
  if (rounded < METERS_PER_KILOMETER) return labels.places.meters(meterFormat.format(rounded))
  return labels.places.kilometers(kilometerFormat.format(meters / METERS_PER_KILOMETER))
}
