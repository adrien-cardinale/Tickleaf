import type { FavoritePlace, Place } from "@tickleaf/core"
import { roundCoordinate } from "./place-draft"

function sameSpot(favorite: FavoritePlace, place: Place): boolean {
  return (
    roundCoordinate(favorite.latitude) === roundCoordinate(place.latitude) &&
    roundCoordinate(favorite.longitude) === roundCoordinate(place.longitude) &&
    favorite.radius === place.radius
  )
}

export function isFavoritePlace(favorites: readonly FavoritePlace[], place: Place): boolean {
  return favorites.some((favorite) => sameSpot(favorite, place))
}
