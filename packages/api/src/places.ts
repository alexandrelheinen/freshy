import { z } from 'zod';
import type { Place, Prisma } from '@freshy/db';
import { PlaceCategory, type PrismaClient, filterPlacesByRadius } from '@freshy/db';
import type { PlacePhotoCategory } from '@freshy/config/place-photos';
import { resolvePlacePhotoForApi } from './place-photo-url';

export const placesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(50).optional().default(3),
  category: z.nativeEnum(PlaceCategory).optional(),
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

export async function listPlaces(
  prisma: PrismaClient,
  query: PlacesQuery,
): Promise<PlaceListItem[]> {
  const lat = query.lat;
  const lng = query.lng;
  const radiusKm = query.radius ?? 3;

  const where: Prisma.PlaceWhereInput = { status: 'PUBLISHED' };
  if (query.category) {
    where.category = query.category;
  }
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { address: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  const places = await prisma.place.findMany({ where, orderBy: { name: 'asc' } });
  const withDistance = filterPlacesByRadius(places, lat, lng, radiusKm);

  return withDistance.map(({ place, distanceKm }) =>
    withResolvedPlacePhoto({
      ...place,
      distanceKm: Math.round(distanceKm * 100) / 100,
    }),
  );
}

export async function categoryCounts(
  prisma: PrismaClient,
): Promise<Array<{ category: PlaceCategory; count: number }>> {
  const groups = await prisma.place.groupBy({
    by: ['category'],
    where: { status: 'PUBLISHED' },
    _count: { category: true },
    orderBy: { category: 'asc' },
  });
  return groups.map((g) => ({ category: g.category, count: g._count.category }));
}

export async function featuredPlace(prisma: PrismaClient): Promise<Place | null> {
  const place = await prisma.place.findFirst({
    where: { aggregatedFreshnessLevel: 'VERY_COLD_AC', status: 'PUBLISHED' },
    orderBy: { name: 'asc' },
  });
  return place ? withResolvedPlacePhoto(place) : null;
}
