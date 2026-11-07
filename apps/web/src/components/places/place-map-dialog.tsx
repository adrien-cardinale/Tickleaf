import "leaflet/dist/leaflet.css"
import { Icon, type LatLngLiteral, type Marker as LeafletMarker } from "leaflet"
import markerIconUrl from "leaflet/dist/images/marker-icon.png"
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png"
import { LocateFixed, Search } from "lucide-react"
import {
  type KeyboardEvent,
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { labels } from "@/lib/labels"
import { type GeocodeResult, searchPlaces } from "@/lib/places/geocode"
import { type PlaceDraft, placeFromDraft, roundCoordinate } from "@/lib/places/place-draft"
import { canReadPosition } from "@/lib/places/position"
import { currentPosition, refreshPosition } from "@/lib/places/position-store"
import { warnPositionFailure } from "@/lib/places/position-warnings"

export type MapPoint = { latitude: number; longitude: number }

type MapView = { center: LatLngLiteral; zoom: number }

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const DEFAULT_VIEW: MapView = { center: { lat: 46.8, lng: 8.2 }, zoom: 8 }
const LOCATED_ZOOM = 15
const SEARCH_ZOOM = 16
const MIN_QUERY_LENGTH = 3
const SEARCH_LIST_ID = "place-search-results"

type SearchHandle = { dismiss: () => boolean }

type SearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "found"; results: GeocodeResult[] }
  | { status: "failed" }

const markerIcon = new Icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
})

function locatedView(center: LatLngLiteral): MapView {
  return { center, zoom: LOCATED_ZOOM }
}

function pointFromDraft(draft: PlaceDraft): LatLngLiteral | null {
  const place = placeFromDraft(draft)
  return place === null ? null : { lat: place.latitude, lng: place.longitude }
}

function initialView(point: LatLngLiteral | null): MapView {
  if (point !== null) return locatedView(point)
  const position = currentPosition()
  if (position.status !== "located") return DEFAULT_VIEW
  return locatedView({ lat: position.position.latitude, lng: position.position.longitude })
}

function SizeOnOpen() {
  const map = useMap()
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize())
    return () => cancelAnimationFrame(frame)
  }, [map])
  return null
}

function PickOnClick({ onPick }: { onPick: (point: LatLngLiteral) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng) })
  return null
}

function FlyTo({ view }: { view: MapView | null }) {
  const map = useMap()
  useEffect(() => {
    if (view !== null) map.setView(view.center, view.zoom)
  }, [map, view])
  return null
}

function isSearchableQuery(query: string): boolean {
  return query.trim().length >= MIN_QUERY_LENGTH
}

function StatusMessage({ text, failed = false }: { text: string; failed?: boolean }) {
  return (
    <p className={failed ? "px-2 py-1.5 text-sm text-destructive" : "px-2 py-1.5 text-sm text-muted-foreground"}>
      {text}
    </p>
  )
}

function SearchStatus({ search, onPick }: { search: SearchState; onPick: (result: GeocodeResult) => void }) {
  if (search.status === "searching") return <StatusMessage text={labels.places.searching} />
  if (search.status === "failed") return <StatusMessage text={labels.places.searchFailed} failed />
  if (search.status !== "found") return null
  if (search.results.length === 0) return <StatusMessage text={labels.places.noResults} />
  return search.results.map((result) => (
    <Button
      key={`${result.latitude},${result.longitude},${result.label}`}
      type="button"
      variant="ghost"
      className="w-full justify-start font-normal"
      title={result.label}
      onClick={() => onPick(result)}
    >
      <span className="truncate">{result.label}</span>
    </Button>
  ))
}

type PlaceSearchProps = { onPick: (point: LatLngLiteral) => void; ref: Ref<SearchHandle> }

function PlaceSearch({ onPick, ref }: PlaceSearchProps) {
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState<SearchState>({ status: "idle" })
  const controllerRef = useRef<AbortController | null>(null)
  const listOpen = search.status !== "idle"

  const cancelSearch = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  useEffect(() => cancelSearch, [cancelSearch])

  const clearResults = () => {
    cancelSearch()
    setSearch({ status: "idle" })
  }

  useImperativeHandle(ref, () => ({
    dismiss: () => {
      if (!listOpen) return false
      clearResults()
      return true
    },
  }))

  const runSearch = () => {
    if (!isSearchableQuery(query)) return
    cancelSearch()
    const controller = new AbortController()
    controllerRef.current = controller
    setSearch({ status: "searching" })
    searchPlaces(query, controller.signal).then(
      (results) => {
        if (!controller.signal.aborted) setSearch({ status: "found", results })
      },
      () => {
        if (!controller.signal.aborted) setSearch({ status: "failed" })
      },
    )
  }

  const changeQuery = (value: string) => {
    setQuery(value)
    if (listOpen) clearResults()
  }

  const pickResult = (result: GeocodeResult) => {
    clearResults()
    setQuery(result.label)
    onPick({ lat: result.latitude, lng: result.longitude })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.key !== "Enter") return
    event.preventDefault()
    runSearch()
  }

  return (
    <div className="relative flex min-w-0 flex-1 gap-2">
      <Input
        type="text"
        value={query}
        placeholder={labels.places.searchPlaceholder}
        aria-label={labels.places.searchPlaceholder}
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={SEARCH_LIST_ID}
        autoComplete="off"
        onChange={(event) => changeQuery(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        title={labels.places.search}
        aria-label={labels.places.search}
        onClick={runSearch}
      >
        <Search />
      </Button>
      {listOpen && (
        <div
          id={SEARCH_LIST_ID}
          className="absolute inset-x-0 top-full z-10 mt-1 flex flex-col rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <SearchStatus search={search} onPick={pickResult} />
        </div>
      )}
    </div>
  )
}

function LocateButton({ onLocate }: { onLocate: (point: LatLngLiteral) => void }) {
  const [locating, setLocating] = useState(false)

  const locate = async () => {
    setLocating(true)
    const reading = await refreshPosition()
    setLocating(false)
    if (reading.status !== "located") {
      warnPositionFailure(reading)
      return
    }
    onLocate({ lat: reading.position.latitude, lng: reading.position.longitude })
  }

  return (
    <Button
      type="button"
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
  )
}

type DraggableMarkerProps = { point: LatLngLiteral; radius: number; onPick: (point: LatLngLiteral) => void }

function DraggableMarker({ point, radius, onPick }: DraggableMarkerProps) {
  const markerRef = useRef<LeafletMarker>(null)
  const eventHandlers = useMemo(
    () => ({
      dragend: () => {
        const marker = markerRef.current
        if (marker !== null) onPick(marker.getLatLng())
      },
    }),
    [onPick],
  )
  return (
    <>
      <Circle center={point} radius={radius} />
      <Marker ref={markerRef} position={point} icon={markerIcon} draggable eventHandlers={eventHandlers} />
    </>
  )
}

type PlaceMapPickerProps = {
  draft: PlaceDraft
  searchRef: Ref<SearchHandle>
  onConfirm: (point: MapPoint) => void
  onCancel: () => void
}

function PlaceMapPicker({ draft, searchRef, onConfirm, onCancel }: PlaceMapPickerProps) {
  const [initialPoint] = useState(() => pointFromDraft(draft))
  const [view] = useState(() => initialView(initialPoint))
  const [point, setPoint] = useState(initialPoint)
  const [focus, setFocus] = useState<MapView | null>(null)

  const placeAndFocus = (target: LatLngLiteral, zoom: number) => {
    setPoint(target)
    setFocus({ center: target, zoom })
  }

  const confirm = () => {
    if (point === null) return
    onConfirm({ latitude: roundCoordinate(point.lat), longitude: roundCoordinate(point.lng) })
  }

  return (
    <>
      <div className="flex gap-2">
        <PlaceSearch ref={searchRef} onPick={(target) => placeAndFocus(target, SEARCH_ZOOM)} />
        {canReadPosition() && <LocateButton onLocate={(target) => placeAndFocus(target, LOCATED_ZOOM)} />}
      </div>
      <div className="relative isolate z-0 h-[50dvh] overflow-hidden rounded-md border sm:h-80">
        <MapContainer center={view.center} zoom={view.zoom} className="size-full">
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <SizeOnOpen />
          <FlyTo view={focus} />
          <PickOnClick onPick={setPoint} />
          {point !== null && <DraggableMarker point={point} radius={draft.radius} onPick={setPoint} />}
        </MapContainer>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {labels.places.cancel}
        </Button>
        <Button type="button" disabled={point === null} onClick={confirm}>
          {labels.places.confirm}
        </Button>
      </DialogFooter>
    </>
  )
}

type PlaceMapDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: PlaceDraft
  onConfirm: (point: MapPoint) => void
}

function keepOpenWhileSearching(searchRef: RefObject<SearchHandle | null>, event: globalThis.KeyboardEvent) {
  if (searchRef.current?.dismiss()) event.preventDefault()
}

export function PlaceMapDialog({ open, onOpenChange, draft, onConfirm }: PlaceMapDialogProps) {
  const searchRef = useRef<SearchHandle>(null)
  const close = () => onOpenChange(false)
  const confirm = (point: MapPoint) => {
    onConfirm(point)
    close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" onEscapeKeyDown={(event) => keepOpenWhileSearching(searchRef, event)}>
        <DialogHeader>
          <DialogTitle>{labels.places.chooseOnMap}</DialogTitle>
          <DialogDescription>{labels.places.mapHint}</DialogDescription>
        </DialogHeader>
        <PlaceMapPicker draft={draft} searchRef={searchRef} onConfirm={confirm} onCancel={close} />
      </DialogContent>
    </Dialog>
  )
}
