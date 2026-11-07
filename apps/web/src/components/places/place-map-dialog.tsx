import "leaflet/dist/leaflet.css"
import { Icon, type LatLngLiteral, type Marker as LeafletMarker } from "leaflet"
import markerIconUrl from "leaflet/dist/images/marker-icon.png"
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png"
import { useEffect, useMemo, useRef, useState } from "react"
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
import { labels } from "@/lib/labels"
import { type PlaceDraft, placeFromDraft, roundCoordinate } from "@/lib/places/place-draft"
import { canReadPosition } from "@/lib/places/position"
import { currentPosition, refreshPosition } from "@/lib/places/position-store"

export type MapPoint = { latitude: number; longitude: number }

type MapView = { center: LatLngLiteral; zoom: number }

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const DEFAULT_VIEW: MapView = { center: { lat: 46.8, lng: 8.2 }, zoom: 8 }
const LOCATED_ZOOM = 15

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

function CenterOnPosition({ enabled }: { enabled: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (!enabled || currentPosition().status !== "pending" || !canReadPosition()) return
    let active = true
    void refreshPosition().then((reading) => {
      if (!active || reading.status !== "located") return
      map.setView({ lat: reading.position.latitude, lng: reading.position.longitude }, LOCATED_ZOOM)
    })
    return () => {
      active = false
    }
  }, [enabled, map])
  return null
}

function PickOnClick({ onPick }: { onPick: (point: LatLngLiteral) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng) })
  return null
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

type PlaceMapPickerProps = { draft: PlaceDraft; onConfirm: (point: MapPoint) => void; onCancel: () => void }

function PlaceMapPicker({ draft, onConfirm, onCancel }: PlaceMapPickerProps) {
  const [initialPoint] = useState(() => pointFromDraft(draft))
  const [view] = useState(() => initialView(initialPoint))
  const [point, setPoint] = useState(initialPoint)

  const confirm = () => {
    if (point === null) return
    onConfirm({ latitude: roundCoordinate(point.lat), longitude: roundCoordinate(point.lng) })
  }

  return (
    <>
      <div className="relative isolate z-0 h-[50dvh] overflow-hidden rounded-md border sm:h-80">
        <MapContainer center={view.center} zoom={view.zoom} className="size-full">
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <SizeOnOpen />
          <CenterOnPosition enabled={initialPoint === null} />
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

export function PlaceMapDialog({ open, onOpenChange, draft, onConfirm }: PlaceMapDialogProps) {
  const close = () => onOpenChange(false)
  const confirm = (point: MapPoint) => {
    onConfirm(point)
    close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{labels.places.chooseOnMap}</DialogTitle>
          <DialogDescription>{labels.places.mapHint}</DialogDescription>
        </DialogHeader>
        <PlaceMapPicker draft={draft} onConfirm={confirm} onCancel={close} />
      </DialogContent>
    </Dialog>
  )
}
