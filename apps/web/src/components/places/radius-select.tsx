import { PLACE_RADII } from "@tickleaf/core"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { labels } from "@/lib/labels"
import { formatDistance } from "@/lib/places/distance"

type RadiusSelectProps = { value: number; onChange: (radius: number) => void }

export function RadiusSelect({ value, onChange }: RadiusSelectProps) {
  return (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger className="w-24 shrink-0" aria-label={labels.places.radius}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PLACE_RADII.map((radius) => (
          <SelectItem key={radius} value={String(radius)}>
            {formatDistance(radius)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
