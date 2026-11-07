import type { FavoritePlace } from "@tickleaf/core"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { labels } from "@/lib/labels"
import { formatDistance } from "@/lib/places/distance"

type FavoritePlaceMenuProps = {
  favorites: readonly FavoritePlace[]
  onPick: (favorite: FavoritePlace) => void
}

export function FavoritePlaceMenu({ favorites, onPick }: FavoritePlaceMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          title={labels.places.pickFavorite}
          aria-label={labels.places.pickFavorite}
        >
          <Star />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {favorites.map((favorite) => (
          <DropdownMenuItem key={favorite.id} onSelect={() => onPick(favorite)}>
            <span className="min-w-0 flex-1 truncate">{favorite.label}</span>
            <span className="text-xs text-muted-foreground">{formatDistance(favorite.radius)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
