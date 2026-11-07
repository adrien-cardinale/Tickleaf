import { type FavoritePlace, PLACE_RADII, type Task } from "@tickleaf/core"
import { LocateFixed, MapPinned, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { FavoritePlaceMenu } from "@/components/places/favorite-place-menu"
import { type MapPoint, PlaceMapDialog } from "@/components/places/place-map-dialog"
import { SaveFavoriteButton } from "@/components/places/save-favorite-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskActions } from "@/hooks/use-task-actions"
import { labels } from "@/lib/labels"
import { formatDistance } from "@/lib/places/distance"
import { onNextGeofenceSync } from "@/lib/places/geofence-sync"
import { draftFromPlace, type PlaceDraft, placeFromDraft, roundCoordinate } from "@/lib/places/place-draft"
import { canReadPosition, type PositionReading } from "@/lib/places/position"
import { refreshPosition } from "@/lib/places/position-store"
import { useFavoritePlaces } from "@/lib/queries"
import { isAndroid } from "@/lib/runtime"

function warnPositionFailure(reading: PositionReading): void {
  if (reading.status === "denied") {
    toast.error(labels.places.permissionDenied, { description: labels.places.permissionHint })
  } else if (reading.status === "unavailable") {
    toast.error(labels.places.unavailable, { description: labels.places.unavailableHint })
  }
}

let backgroundWarningPending = false

function warnWhenBackgroundDenied(): void {
  if (backgroundWarningPending) return
  backgroundWarningPending = true
  onNextGeofenceSync(({ status }) => {
    backgroundWarningPending = false
    if (status === "denied")
      toast.warning(labels.places.backgroundDenied, { description: labels.places.backgroundHint })
  })
}

type CoordinateInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function CoordinateInput({ id, label, value, onChange }: CoordinateInputProps) {
  return (
    <Input
      id={id}
      inputMode="decimal"
      value={value}
      placeholder={label}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function PlaceField({ task }: { task: Task }) {
  const { update } = useTaskActions()
  const [draft, setDraft] = useState<PlaceDraft>(() => draftFromPlace(task.place))
  const [locating, setLocating] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const { data: favorites = [] } = useFavoritePlaces()
  const locatable = canReadPosition()

  const change = (patch: Partial<PlaceDraft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    const place = placeFromDraft(next)
    if (place === null) return
    if (task.place === null && isAndroid()) warnWhenBackgroundDenied()
    void update(task.id, { place })
  }

  const locate = async () => {
    setLocating(true)
    const reading = await refreshPosition()
    setLocating(false)
    if (reading.status !== "located") {
      warnPositionFailure(reading)
      return
    }
    change({
      latitude: String(roundCoordinate(reading.position.latitude)),
      longitude: String(roundCoordinate(reading.position.longitude)),
    })
  }

  const pickOnMap = ({ latitude, longitude }: MapPoint) => {
    change({ latitude: String(latitude), longitude: String(longitude) })
  }

  const applyFavorite = (favorite: FavoritePlace) => {
    change({
      latitude: String(favorite.latitude),
      longitude: String(favorite.longitude),
      radius: favorite.radius,
      label: favorite.label,
    })
  }

  const remove = () => {
    setDraft(draftFromPlace(null))
    void update(task.id, { place: null })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="task-place-latitude" className="text-xs text-muted-foreground">
        {labels.detail.fieldPlace}
      </Label>
      <div className="flex items-center gap-2">
        <CoordinateInput
          id="task-place-latitude"
          label={labels.places.latitude}
          value={draft.latitude}
          onChange={(latitude) => change({ latitude })}
        />
        <CoordinateInput
          id="task-place-longitude"
          label={labels.places.longitude}
          value={draft.longitude}
          onChange={(longitude) => change({ longitude })}
        />
        {locatable && (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={locating}
            title={labels.places.useMyPosition}
            aria-label={labels.places.useMyPosition}
            onClick={() => void locate()}
          >
            <LocateFixed />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          title={labels.places.chooseOnMap}
          aria-label={labels.places.chooseOnMap}
          onClick={() => setMapOpen(true)}
        >
          <MapPinned />
        </Button>
        {favorites.length > 0 && <FavoritePlaceMenu favorites={favorites} onPick={applyFavorite} />}
      </div>
      {task.place !== null && (
        <div className="flex items-center gap-2">
          <Input
            value={draft.label}
            aria-label={labels.places.label}
            placeholder={labels.places.labelPlaceholder}
            onChange={(event) => change({ label: event.target.value })}
          />
          <Select value={String(draft.radius)} onValueChange={(value) => change({ radius: Number(value) })}>
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
          <SaveFavoriteButton place={task.place} />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            title={labels.places.remove}
            aria-label={labels.places.remove}
            onClick={remove}
          >
            <X />
          </Button>
        </div>
      )}
      <PlaceMapDialog open={mapOpen} onOpenChange={setMapOpen} draft={draft} onConfirm={pickOnMap} />
      {!locatable && <p className="text-xs text-muted-foreground">{labels.places.webHint}</p>}
    </div>
  )
}
