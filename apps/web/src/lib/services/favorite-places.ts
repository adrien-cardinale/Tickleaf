import type { FavoritePlace, Place } from "@tickleaf/core"
import { type Db, favoritePlaces } from "@tickleaf/db"
import { and, asc, eq, isNull, max } from "@tickleaf/db/orm"
import { labels } from "@/lib/labels"
import { newId, nowIso, touched } from "./clock"

export async function listFavoritePlaces(db: Db): Promise<FavoritePlace[]> {
  return db
    .select({
      id: favoritePlaces.id,
      label: favoritePlaces.label,
      latitude: favoritePlaces.latitude,
      longitude: favoritePlaces.longitude,
      radius: favoritePlaces.radius,
      position: favoritePlaces.position,
      createdAt: favoritePlaces.createdAt,
      updatedAt: favoritePlaces.updatedAt,
    })
    .from(favoritePlaces)
    .where(isNull(favoritePlaces.deletedAt))
    .orderBy(asc(favoritePlaces.position), asc(favoritePlaces.label))
}

async function nextPosition(db: Db): Promise<number> {
  const [row] = await db.select({ value: max(favoritePlaces.position) }).from(favoritePlaces)
  return (row?.value ?? -1) + 1
}

function labelOrDefault(label: string): string {
  const trimmed = label.trim()
  return trimmed === "" ? labels.places.defaultFavoriteLabel : trimmed
}

export async function createFavoritePlace(db: Db, place: Place): Promise<FavoritePlace> {
  const timestamp = nowIso()
  const favorite: FavoritePlace = {
    ...place,
    id: newId(),
    label: labelOrDefault(place.label),
    position: await nextPosition(db),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.insert(favoritePlaces).values(favorite)
  return favorite
}

export async function updateFavoritePlace(db: Db, id: string, patch: Partial<Place>): Promise<void> {
  const changes = patch.label === undefined ? patch : { ...patch, label: labelOrDefault(patch.label) }
  await db
    .update(favoritePlaces)
    .set({ ...changes, ...touched() })
    .where(eq(favoritePlaces.id, id))
}

export async function deleteFavoritePlace(db: Db, id: string): Promise<void> {
  const timestamp = nowIso()
  await db
    .update(favoritePlaces)
    .set({ deletedAt: timestamp, ...touched(timestamp) })
    .where(and(eq(favoritePlaces.id, id), isNull(favoritePlaces.deletedAt)))
}
