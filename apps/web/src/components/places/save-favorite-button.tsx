import type { Place } from "@tickleaf/core"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFavoritePlaceActions } from "@/hooks/use-favorite-place-actions"
import { labels } from "@/lib/labels"
import { isFavoritePlace } from "@/lib/places/favorites"
import { useFavoritePlaces } from "@/lib/queries"

export function SaveFavoriteButton({ place }: { place: Place }) {
  const { data: favorites = [] } = useFavoritePlaces()
  const { saveFromTask } = useFavoritePlaceActions()
  const saved = isFavoritePlace(favorites, place)
  const title = saved ? labels.places.alreadyFavorite : labels.places.saveAsFavorite

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0"
      disabled={saved}
      title={title}
      aria-label={title}
      onClick={() => void saveFromTask(place)}
    >
      <Star className={saved ? "fill-current" : undefined} />
    </Button>
  )
}
