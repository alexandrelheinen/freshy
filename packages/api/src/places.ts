import { z } from 'zod';
import { eq, and, or, like, sql } from 'drizzle-orm';
import type { Place } from '@freshy/db';
import { PLACE_CATEGORIES, type PlaceCategory, places as placesTable, filterPlacesByRadius } from '@freshy/db';
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

export interface PlaceListItem extends Place {
  distanceKm?: number;
}

export async function listPlaces(db: Db, query: PlacesQuery): Promise<PlaceListItem[]> {
  const lat = query.lat;
  const lng = query.lng;
  const radiusKm = query.radius ?? PILOT_CITY.defaultRadiusKm;

  const conditions = [eq(placesTable.status, 'PUBLISHED')];

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
          eq(placesTable.status, 'PUBLISHED'),
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
    withResolvedPlacePhoto({
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

export async function featuredPlace(db: Db): Promise<Place | null> {
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
  return place ? withResolvedPlacePhoto(place) : null;
}
