import { DEFAULT_PLACE_RADIUS, type FavoritePlace } from "@tickleaf/core"
import { Plus, X } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"
import { type MapPoint, PlaceMapDialog } from "@/components/places/place-map-dialog"
import { RadiusSelect } from "@/components/places/radius-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useFavoritePlaceActions } from "@/hooks/use-favorite-place-actions"
import { labels } from "@/lib/labels"
import { draftFromPlace } from "@/lib/places/place-draft"
import { useFavoritePlaces } from "@/lib/queries"

const text = labels.places
const EMPTY_DRAFT = draftFromPlace(null)

type FavoriteLabelInputProps = { label: string; onRename: (label: string) => void }

function FavoriteLabelInput({ label, onRename }: FavoriteLabelInputProps) {
  const [draft, setDraft] = useState(label)

  useEffect(() => setDraft(label), [label])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed === "") {
      setDraft(label)
      return
    }
    if (trimmed !== label) onRename(trimmed)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    commit()
  }

  return (
    <form onSubmit={submit} className="min-w-0 flex-1">
      <Input
        value={draft}
        aria-label={text.label}
        placeholder={text.label}
        autoComplete="off"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
      />
    </form>
  )
}

function FavoritePlaceRow({ favorite }: { favorite: FavoritePlace }) {
  const { update, remove } = useFavoritePlaceActions()

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2">
        <FavoriteLabelInput label={favorite.label} onRename={(label) => void update(favorite.id, { label })} />
        <RadiusSelect value={favorite.radius} onChange={(radius) => void update(favorite.id, { radius })} />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          title={text.removeFavorite}
          aria-label={text.removeFavorite}
          onClick={() => void remove(favorite.id)}
        >
          <X />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{text.coordinates(favorite.latitude, favorite.longitude)}</p>
    </li>
  )
}

export function FavoritePlacesCard() {
  const { data: favorites = [] } = useFavoritePlaces()
  const { create } = useFavoritePlaceActions()
  const [mapOpen, setMapOpen] = useState(false)

  const addFromMap = ({ latitude, longitude }: MapPoint) => {
    void create({ latitude, longitude, radius: DEFAULT_PLACE_RADIUS, label: "" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.favorites}</CardTitle>
        <CardDescription>{text.favoritesDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">{text.noFavorites}</p>
        ) : (
          <ul className="space-y-3">
            {favorites.map((favorite) => (
              <FavoritePlaceRow key={favorite.id} favorite={favorite} />
            ))}
          </ul>
        )}
        <Button variant="outline" onClick={() => setMapOpen(true)}>
          <Plus />
          {text.addFavorite}
        </Button>
        <PlaceMapDialog open={mapOpen} onOpenChange={setMapOpen} draft={EMPTY_DRAFT} onConfirm={addFromMap} />
      </CardContent>
    </Card>
  )
}
