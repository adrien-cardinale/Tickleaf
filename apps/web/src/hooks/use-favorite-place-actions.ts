import type { Place } from "@tickleaf/core"
import { toast } from "sonner"
import { labels } from "@/lib/labels"
import { useDbAction } from "@/lib/queries"
import { createFavoritePlace, deleteFavoritePlace, updateFavoritePlace } from "@/lib/services/favorite-places"

export function useFavoritePlaceActions() {
  const execute = useDbAction()

  return {
    create: async (place: Place): Promise<boolean> => {
      return (await execute((db) => createFavoritePlace(db, place))) !== null
    },

    saveFromTask: async (place: Place) => {
      const created = await execute((db) => createFavoritePlace(db, place))
      if (created) toast.success(labels.places.favoriteSaved)
    },

    update: async (id: string, patch: Partial<Place>) => {
      await execute((db) => updateFavoritePlace(db, id, patch))
    },

    remove: async (id: string) => {
      await execute((db) => deleteFavoritePlace(db, id))
    },
  }
}
