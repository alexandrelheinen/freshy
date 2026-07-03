import { z } from 'zod';
import { eq, like, or, sql, desc, inArray } from 'drizzle-orm';
import { FRESHNESS_LEVEL_IDS, freshnessLevelScore } from '@freshy/config/freshness-levels';
import { PLACE_TAG_IDS } from '@freshy/config/place-tags';
import {
  PLACE_CATEGORIES,
  type Place,
  type FreshnessLevel,
  type Db,
  haversineDistanceKm,
} from '@freshy/db';
import {
  places as placesTable,
  reviews as reviewsTable,
  savedPlaces as savedPlacesTable,
  users as usersTable,
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
    category: z.enum(PLACE_CATEGORIES).optional(),
    address: z.string().trim().min(3).max(240).nullable().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    aggregatedFreshnessLevel: z
      .enum(FRESHNESS_LEVEL_IDS as [string, ...string[]])
      .nullable()
      .optional(),
    tags: z.array(z.enum(PLACE_TAG_IDS as [string, ...string[]])).optional(),
    photoUrl: z.string().url().nullable().optional(),
    isOpen: z.boolean().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

function parseOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseTagsField(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string');
  }
  if (typeof value !== 'string' || value.trim() === '') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [];
  } catch {
    return [];
  }
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

/** Parse multipart or urlencoded studio update fields from form bodies. */
export function parseUpdateStudioPlaceFields(
  body: Record<string, unknown>,
): ReturnType<typeof updateStudioPlaceSchema.safeParse> {
  const tags = parseTagsField(body.tags);
  const photoUrlRaw = body.photoUrl;
  const photoUrl =
    photoUrlRaw === '' || photoUrlRaw === 'null'
      ? null
      : typeof photoUrlRaw === 'string'
        ? photoUrlRaw
        : undefined;

  return updateStudioPlaceSchema.safeParse({
    name: typeof body.name === 'string' ? body.name : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    category: typeof body.category === 'string' ? body.category : undefined,
    address: typeof body.address === 'string' ? body.address : undefined,
    latitude: parseOptionalNumber(body.latitude),
    longitude: parseOptionalNumber(body.longitude),
    aggregatedFreshnessLevel:
      typeof body.aggregatedFreshnessLevel === 'string'
        ? body.aggregatedFreshnessLevel
        : typeof body.freshnessLevel === 'string'
          ? body.freshnessLevel
          : undefined,
    tags,
    photoUrl,
    isOpen: parseOptionalBoolean(body.isOpen),
    status: typeof body.status === 'string' ? body.status : undefined,
  });
}

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

export interface StudioContributor {
  id: string;
  email: string;
  displayName: string;
  username: string;
}

export interface StudioPlaceListItem extends Place {
  studioStatus: StudioPlaceStatus;
  duplicateOfId: string | null;
  contributor: StudioContributor | null;
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
  createdAt: string | Date;
}

function createdAtMs(value: string | Date): number {
  return new Date(value).getTime();
}

/** Mark newer nearby places as duplicates of the oldest place in each cluster. */
export function detectDuplicatePlaceIds(places: PlaceCoord[]): Map<string, string> {
  const sorted = [...places].sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt));
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

export function studioContributorForPlace(
  createdById: string | null,
  contributors: Map<string, StudioContributor>,
): StudioContributor | null {
  if (!createdById) return null;
  return contributors.get(createdById) ?? null;
}

async function loadContributorsByUserIds(
  db: Db,
  userIds: Array<string | null | undefined>,
): Promise<Map<string, StudioContributor>> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return new Map();

  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      username: usersTable.username,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, uniqueIds));

  return new Map(rows.map((row) => [row.id, row]));
}

function enrichStudioPlace(
  place: Place,
  duplicateOfId: string | null,
  contributors: Map<string, StudioContributor>,
): StudioPlaceListItem {
  return {
    ...withResolvedPlacePhoto(place),
    studioStatus: studioStatusForPlace(place, duplicateOfId),
    duplicateOfId,
    contributor: studioContributorForPlace(place.createdById, contributors),
  };
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
  db: Db,
  query: StudioPlacesQuery,
): Promise<StudioPlacesPage> {
  let allPlaces: Place[];
  if (query.q) {
    const pattern = `%${query.q}%`;
    allPlaces = await db
      .select()
      .from(placesTable)
      .where(
        or(
          like(placesTable.name, pattern),
          like(placesTable.address, pattern),
          like(placesTable.slug, pattern),
        ),
      )
      .orderBy(desc(placesTable.createdAt));
  } else {
    allPlaces = await db.select().from(placesTable).orderBy(desc(placesTable.createdAt));
  }

  const duplicateMap = detectDuplicatePlaceIds(allPlaces);
  const contributors = await loadContributorsByUserIds(
    db,
    allPlaces.map((place) => place.createdById),
  );
  const enriched: StudioPlaceListItem[] = allPlaces.map((place) =>
    enrichStudioPlace(place, duplicateMap.get(place.id) ?? null, contributors),
  );

  const filtered = enriched.filter((place) => matchesStudioFilter(place, query.status));
  const total = filtered.length;
  const offset = (query.page - 1) * query.limit;
  const items = filtered.slice(offset, offset + query.limit);

  return { items, total, page: query.page, limit: query.limit };
}

export async function getStudioStats(db: Db): Promise<StudioStats> {
  const coordRows = await db
    .select({
      id: placesTable.id,
      latitude: placesTable.latitude,
      longitude: placesTable.longitude,
      createdAt: placesTable.createdAt,
      status: placesTable.status,
      aggregatedFreshnessLevel: placesTable.aggregatedFreshnessLevel,
    })
    .from(placesTable);

  const duplicateMap = detectDuplicatePlaceIds(coordRows);
  const pendingValidation = coordRows.filter((p) => p.status === 'DRAFT').length;
  const totalVerified = coordRows.filter((p) => p.status === 'PUBLISHED').length;
  const scores = coordRows
    .map((p) => freshnessLevelScore(p.aggregatedFreshnessLevel))
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
  db: Db,
  placeId: string,
  input: UpdateStudioPlaceInput,
): Promise<Place> {
  const now = new Date().toISOString();
  const { tags, aggregatedFreshnessLevel, ...rest } = input;

  await db
    .update(placesTable)
    .set({
      ...rest,
      ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      ...(aggregatedFreshnessLevel !== undefined
        ? { aggregatedFreshnessLevel: aggregatedFreshnessLevel as FreshnessLevel | null }
        : {}),
      updatedAt: now,
    })
    .where(eq(placesTable.id, placeId));

  const rows = await db.select().from(placesTable).where(eq(placesTable.id, placeId)).limit(1);
  return withResolvedPlacePhoto(rows[0]!);
}

export async function approveStudioPlace(db: Db, placeId: string): Promise<Place> {
  const now = new Date().toISOString();
  await db
    .update(placesTable)
    .set({ status: 'PUBLISHED', updatedAt: now })
    .where(eq(placesTable.id, placeId));
  const rows = await db.select().from(placesTable).where(eq(placesTable.id, placeId)).limit(1);
  return withResolvedPlacePhoto(rows[0]!);
}

export async function deleteStudioPlace(db: Db, placeId: string): Promise<void> {
  await db.delete(placesTable).where(eq(placesTable.id, placeId));
}

export async function mergeStudioPlaces(db: Db, input: MergePlacesInput): Promise<Place> {
  const targetRows = await db
    .select()
    .from(placesTable)
    .where(eq(placesTable.id, input.targetPlaceId))
    .limit(1);
  const sourceRows = await db
    .select()
    .from(placesTable)
    .where(eq(placesTable.id, input.sourcePlaceId))
    .limit(1);
  if (!targetRows[0] || !sourceRows[0]) {
    throw new Error('Place not found');
  }

  // Move reviews from source to target (skip duplicates)
  const sourceReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.placeId, input.sourcePlaceId));

  for (const review of sourceReviews) {
    const existing = await db
      .select({ id: reviewsTable.id })
      .from(reviewsTable)
      .where(
        sql`${reviewsTable.userId} = ${review.userId} AND ${reviewsTable.placeId} = ${input.targetPlaceId}`,
      )
      .limit(1);

    if (existing.length > 0) {
      await db.delete(reviewsTable).where(eq(reviewsTable.id, review.id));
    } else {
      await db
        .update(reviewsTable)
        .set({ placeId: input.targetPlaceId })
        .where(eq(reviewsTable.id, review.id));
    }
  }

  // Move saved places from source to target (skip duplicates)
  const sourceSaved = await db
    .select()
    .from(savedPlacesTable)
    .where(eq(savedPlacesTable.placeId, input.sourcePlaceId));

  for (const row of sourceSaved) {
    const existing = await db
      .select({ id: savedPlacesTable.id })
      .from(savedPlacesTable)
      .where(
        sql`${savedPlacesTable.userId} = ${row.userId} AND ${savedPlacesTable.placeId} = ${input.targetPlaceId}`,
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(savedPlacesTable).values({
        id: crypto.randomUUID(),
        userId: row.userId,
        placeId: input.targetPlaceId,
      });
    }
  }

  await db.delete(savedPlacesTable).where(eq(savedPlacesTable.placeId, input.sourcePlaceId));
  await db.delete(placesTable).where(eq(placesTable.id, input.sourcePlaceId));

  const merged = await db
    .select()
    .from(placesTable)
    .where(eq(placesTable.id, input.targetPlaceId))
    .limit(1);
  return withResolvedPlacePhoto(merged[0]!);
}

export async function getStudioPlace(db: Db, placeId: string): Promise<StudioPlaceListItem | null> {
  const rows = await db.select().from(placesTable).where(eq(placesTable.id, placeId)).limit(1);
  if (!rows[0]) return null;
  const place = rows[0];

  const allPlaces = await db
    .select({
      id: placesTable.id,
      latitude: placesTable.latitude,
      longitude: placesTable.longitude,
      createdAt: placesTable.createdAt,
    })
    .from(placesTable);
  const duplicateOfId = detectDuplicatePlaceIds(allPlaces).get(place.id) ?? null;
  const contributors = await loadContributorsByUserIds(db, [place.createdById]);

  return enrichStudioPlace(place, duplicateOfId, contributors);
}
