import { z } from 'zod';
import { eq, and, or, like, sql, desc, inArray } from 'drizzle-orm';
import type { Place } from '@freshy/db';
import {
  PLACE_CATEGORIES,
  type PlaceCategory,
  places as placesTable,
  reviews as reviewsTable,
  users as usersTable,
  filterPlacesByRadius,
} from '@freshy/db';
import { PILOT_CITY } from '@freshy/config/pilot-city';
import type { PlacePhotoCategory } from '@freshy/config/place-photos';
import type { Db } from '@freshy/db';
import { resolvePlacePhotoForApi } from './place-photo-url';

export const placesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(50).optional().default(PILOT_CITY.defaultRadiusKm),
  category: z.enum(PLACE_CATEGORIES).optional(),
  q: z.string().trim().optional(),
  verifiedOnly: z.preprocess(
    (value) => value === true || value === 'true' || value === '1',
    z.boolean().optional(),
  ),
});

export type PlacesQuery = z.infer<typeof placesQuerySchema>;

export function withResolvedPlacePhoto<T extends Pick<Place, 'photoUrl' | 'category'>>(
  place: T,
): T {
  return {
    ...place,
    photoUrl: resolvePlacePhotoForApi(place.photoUrl, place.category as PlacePhotoCategory),
  };
}

/** D1 stores tags as a JSON string; API clients expect a string array. */
export function parseStoredTags(tags: string | string[] | null | undefined): string[] {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  try {
    const parsed: unknown = JSON.parse(tags);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((tag): tag is string => typeof tag === 'string');
  } catch {
    return [];
  }
}

export function serializePlaceForApi<
  T extends Pick<Place, 'photoUrl' | 'category' | 'tags'> & { createdById?: string | null },
>(place: T): Omit<T, 'tags' | 'createdById'> & { tags: string[] } {
  const resolved = withResolvedPlacePhoto(place);
  const { tags: _tags, createdById: _createdById, ...publicPlace } = resolved;
  return {
    ...publicPlace,
    tags: parseStoredTags(place.tags),
  } as Omit<T, 'tags' | 'createdById'> & { tags: string[] };
}

export interface PlaceListItem extends Omit<Place, 'tags'> {
  tags: string[];
  distanceKm?: number;
}

export function publishedPlaceStatuses(query: PlacesQuery): Array<Place['status']> {
  if (query.verifiedOnly) return ['PUBLISHED'];
  return ['PUBLISHED', 'DRAFT'];
}

export async function listPlaces(db: Db, query: PlacesQuery): Promise<PlaceListItem[]> {
  const lat = query.lat;
  const lng = query.lng;
  const radiusKm = query.radius ?? PILOT_CITY.defaultRadiusKm;
  const statuses = publishedPlaceStatuses(query);

  const conditions = [inArray(placesTable.status, statuses)];

  if (query.category) {
    conditions.push(eq(placesTable.category, query.category));
  }

  let results: Place[];
  if (query.q) {
    const pattern = `%${query.q}%`;
    results = await db
      .select()
      .from(placesTable)
      .where(
        and(
          inArray(placesTable.status, statuses),
          query.category ? eq(placesTable.category, query.category) : sql`1=1`,
          or(
            like(placesTable.name, pattern),
            like(placesTable.address, pattern),
            like(placesTable.description, pattern),
          ),
        ),
      )
      .orderBy(placesTable.name);
  } else {
    results = await db
      .select()
      .from(placesTable)
      .where(and(...conditions))
      .orderBy(placesTable.name);
  }

  const withDistance = filterPlacesByRadius(results, lat, lng, radiusKm);

  return withDistance.map(({ place, distanceKm }) =>
    serializePlaceForApi({
      ...place,
      distanceKm: Math.round(distanceKm * 100) / 100,
    }),
  );
}

export async function categoryCounts(
  db: Db,
): Promise<Array<{ category: PlaceCategory; count: number }>> {
  const rows = await db
    .select({ category: placesTable.category, count: sql<number>`count(*)` })
    .from(placesTable)
    .where(eq(placesTable.status, 'PUBLISHED'))
    .groupBy(placesTable.category)
    .orderBy(placesTable.category);
  return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
}

export async function featuredPlace(
  db: Db,
): Promise<(Omit<Place, 'tags'> & { tags: string[] }) | null> {
  const rows = await db
    .select()
    .from(placesTable)
    .where(
      and(
        eq(placesTable.aggregatedFreshnessLevel, 'VERY_COLD_AC'),
        eq(placesTable.status, 'PUBLISHED'),
      ),
    )
    .orderBy(placesTable.name)
    .limit(1);
  const place = rows[0] ?? null;
  return place ? serializePlaceForApi(place) : null;
}

export interface PlaceReviewSummary {
  id: string;
  acStrength: number;
  comment: string | null;
  createdAt: string;
  user: { displayName: string; username: string };
}

export interface PlaceDetail extends Omit<Place, 'tags'> {
  tags: string[];
  reviews: PlaceReviewSummary[];
}

export async function getPlaceBySlugWithReviews(db: Db, slug: string): Promise<PlaceDetail | null> {
  const placeRows = await db.select().from(placesTable).where(eq(placesTable.slug, slug)).limit(1);
  const place = placeRows[0];
  if (!place || (place.status !== 'PUBLISHED' && place.status !== 'DRAFT')) {
    return null;
  }

  const reviewRows = await db
    .select({
      id: reviewsTable.id,
      acStrength: reviewsTable.acStrength,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      displayName: usersTable.displayName,
      username: usersTable.username,
    })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.placeId, place.id))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(10);

  return {
    ...serializePlaceForApi(place),
    reviews: reviewRows.map((row) => ({
      id: row.id,
      acStrength: row.acStrength,
      comment: row.comment,
      createdAt: row.createdAt,
      user: { displayName: row.displayName, username: row.username },
    })),
  };
}
