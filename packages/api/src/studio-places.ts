import { z } from 'zod';
import { FRESHNESS_LEVEL_IDS, freshnessLevelScore } from '@freshy/config/freshness-levels';
import { PLACE_TAG_IDS } from '@freshy/config/place-tags';
import {
  FreshnessLevel,
  PlaceCategory,
  type Place,
  type Prisma,
  type PrismaClient,
  haversineDistanceKm,
} from '@freshy/db';
import { withResolvedPlacePhoto } from './places';

const DUPLICATE_RADIUS_KM = 0.05;

export const studioPlacesQuerySchema = z.object({
  status: z.enum(['all', 'verified', 'pending', 'duplicate']).optional().default('all'),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export type StudioPlacesQuery = z.infer<typeof studioPlacesQuerySchema>;

export const updateStudioPlaceSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    category: z.nativeEnum(PlaceCategory).optional(),
    address: z.string().trim().min(3).max(240).nullable().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    aggregatedFreshnessLevel: z
      .enum(FRESHNESS_LEVEL_IDS as [string, ...string[]])
      .nullable()
      .optional(),
    tags: z.array(z.enum(PLACE_TAG_IDS as [string, ...string[]])).optional(),
    isOpen: z.boolean().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export type UpdateStudioPlaceInput = z.infer<typeof updateStudioPlaceSchema>;

export const mergePlacesSchema = z
  .object({
    targetPlaceId: z.string().min(1),
    sourcePlaceId: z.string().min(1),
  })
  .refine((data) => data.targetPlaceId !== data.sourcePlaceId, {
    message: 'Source and target must differ',
    path: ['sourcePlaceId'],
  });

export type MergePlacesInput = z.infer<typeof mergePlacesSchema>;

export type StudioPlaceStatus = 'verified' | 'pending' | 'duplicate';

export interface StudioPlaceListItem extends Place {
  studioStatus: StudioPlaceStatus;
  duplicateOfId: string | null;
}

export interface StudioPlacesPage {
  items: StudioPlaceListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface StudioStats {
  totalVerified: number;
  pendingValidation: number;
  activeConflicts: number;
  averageFreshnessScore: number | null;
}

interface PlaceCoord {
  id: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

/** Mark newer nearby places as duplicates of the oldest place in each cluster. */
export function detectDuplicatePlaceIds(places: PlaceCoord[]): Map<string, string> {
  const sorted = [...places].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const duplicates = new Map<string, string>();

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    for (let j = 0; j < i; j += 1) {
      const earlier = sorted[j]!;
      const distanceKm = haversineDistanceKm(
        current.latitude,
        current.longitude,
        earlier.latitude,
        earlier.longitude,
      );
      if (distanceKm <= DUPLICATE_RADIUS_KM) {
        duplicates.set(current.id, earlier.id);
        break;
      }
    }
  }

  return duplicates;
}

function studioStatusForPlace(place: Place, duplicateOfId: string | null): StudioPlaceStatus {
  if (duplicateOfId) return 'duplicate';
  if (place.status === 'PUBLISHED') return 'verified';
  return 'pending';
}

function matchesStudioFilter(
  place: StudioPlaceListItem,
  status: StudioPlacesQuery['status'],
): boolean {
  if (status === 'all') return true;
  if (status === 'verified') return place.studioStatus === 'verified';
  if (status === 'pending') return place.studioStatus === 'pending';
  return place.studioStatus === 'duplicate';
}

export async function listStudioPlaces(
  prisma: PrismaClient,
  query: StudioPlacesQuery,
): Promise<StudioPlacesPage> {
  const where: Prisma.PlaceWhereInput = {};
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { address: { contains: query.q, mode: 'insensitive' } },
      { slug: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  const allPlaces = await prisma.place.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const duplicateMap = detectDuplicatePlaceIds(allPlaces);
  const enriched: StudioPlaceListItem[] = allPlaces.map((place) => {
    const duplicateOfId = duplicateMap.get(place.id) ?? null;
    return {
      ...withResolvedPlacePhoto(place),
      studioStatus: studioStatusForPlace(place, duplicateOfId),
      duplicateOfId,
    };
  });

  const filtered = enriched.filter((place) => matchesStudioFilter(place, query.status));
  const total = filtered.length;
  const offset = (query.page - 1) * query.limit;
  const items = filtered.slice(offset, offset + query.limit);

  return { items, total, page: query.page, limit: query.limit };
}

export async function getStudioStats(prisma: PrismaClient): Promise<StudioStats> {
  const places = await prisma.place.findMany({
    select: {
      id: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      status: true,
      aggregatedFreshnessLevel: true,
    },
  });

  const duplicateMap = detectDuplicatePlaceIds(places);
  const pendingValidation = places.filter((place) => place.status === 'DRAFT').length;
  const totalVerified = places.filter((place) => place.status === 'PUBLISHED').length;
  const scores = places
    .map((place) => freshnessLevelScore(place.aggregatedFreshnessLevel))
    .filter((value): value is number => value != null);
  const averageFreshnessScore =
    scores.length > 0
      ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10
      : null;

  return {
    totalVerified,
    pendingValidation,
    activeConflicts: duplicateMap.size,
    averageFreshnessScore,
  };
}

export async function updateStudioPlace(
  prisma: PrismaClient,
  placeId: string,
  input: UpdateStudioPlaceInput,
): Promise<Place> {
  const { aggregatedFreshnessLevel, ...rest } = input;
  const place = await prisma.place.update({
    where: { id: placeId },
    data: {
      ...rest,
      ...(aggregatedFreshnessLevel !== undefined
        ? { aggregatedFreshnessLevel: aggregatedFreshnessLevel as FreshnessLevel | null }
        : {}),
    },
  });
  return withResolvedPlacePhoto(place);
}

export async function approveStudioPlace(prisma: PrismaClient, placeId: string): Promise<Place> {
  const place = await prisma.place.update({
    where: { id: placeId },
    data: { status: 'PUBLISHED' },
  });
  return withResolvedPlacePhoto(place);
}

export async function deleteStudioPlace(prisma: PrismaClient, placeId: string): Promise<void> {
  await prisma.place.delete({ where: { id: placeId } });
}

export async function mergeStudioPlaces(
  prisma: PrismaClient,
  input: MergePlacesInput,
): Promise<Place> {
  const target = await prisma.place.findUnique({ where: { id: input.targetPlaceId } });
  const source = await prisma.place.findUnique({ where: { id: input.sourcePlaceId } });
  if (!target || !source) {
    throw new Error('Place not found');
  }

  await prisma.$transaction(async (tx) => {
    const reviews = await tx.review.findMany({ where: { placeId: input.sourcePlaceId } });
    for (const review of reviews) {
      const existing = await tx.review.findFirst({
        where: { userId: review.userId, placeId: input.targetPlaceId },
      });
      if (existing) {
        await tx.review.delete({ where: { id: review.id } });
      } else {
        await tx.review.update({
          where: { id: review.id },
          data: { placeId: input.targetPlaceId },
        });
      }
    }

    const saved = await tx.savedPlace.findMany({ where: { placeId: input.sourcePlaceId } });
    for (const row of saved) {
      await tx.savedPlace.upsert({
        where: {
          userId_placeId: { userId: row.userId, placeId: input.targetPlaceId },
        },
        update: {},
        create: { userId: row.userId, placeId: input.targetPlaceId },
      });
    }
    await tx.savedPlace.deleteMany({ where: { placeId: input.sourcePlaceId } });
    await tx.place.delete({ where: { id: input.sourcePlaceId } });
  });

  const merged = await prisma.place.findUniqueOrThrow({ where: { id: input.targetPlaceId } });
  return withResolvedPlacePhoto(merged);
}

export async function getStudioPlace(
  prisma: PrismaClient,
  placeId: string,
): Promise<StudioPlaceListItem | null> {
  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) return null;

  const allPlaces = await prisma.place.findMany({
    select: { id: true, latitude: true, longitude: true, createdAt: true },
  });
  const duplicateOfId = detectDuplicatePlaceIds(allPlaces).get(place.id) ?? null;

  return {
    ...withResolvedPlacePhoto(place),
    studioStatus: studioStatusForPlace(place, duplicateOfId),
    duplicateOfId,
  };
}
