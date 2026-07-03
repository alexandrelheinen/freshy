import { z } from 'zod';
import { eq, like, or, sql, desc } from 'drizzle-orm';
import { FRESHNESS_LEVEL_IDS } from '@freshy/config/freshness-levels';
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
} from '@freshy/db';
import { withResolvedPlacePhoto, serializePlaceForApi } from './places';
import {
  loadStudioPlacesWithContributors,
  normalizeCreatedById,
  type StudioContributor,
} from './studio-contributors';

const DUPLICATE_RADIUS_KM = 0.05;

export const studioPlacesQuerySchema = z.object({
  status: z.enum(['all', 'verified', 'pending']).optional().default('all'),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export type StudioPlacesQuery = z.infer<typeof studioPlacesQuerySchema>;

export const studioDuplicatesQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export type StudioDuplicatesQuery = z.infer<typeof studioDuplicatesQuerySchema>;

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

export type { StudioContributor } from './studio-contributors';

export interface StudioPlaceListItem extends Omit<Place, 'tags' | 'createdById'> {
  tags: string[];
  createdById: string | null;
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
}

/** Fill contributor profiles when list items are missing contributor data. */
export async function attachMissingContributors(
  db: Db,
  items: StudioPlaceListItem[],
): Promise<StudioPlaceListItem[]> {
  const missingIds = items
    .filter((item) => !item.contributor && item.createdById)
    .map((item) => item.id);
  if (missingIds.length === 0) return items;

  const loaded = await loadStudioPlacesWithContributors(db, missingIds);
  const contributorsByPlaceId = new Map(
    loaded.map((row) => [row.place.id, row.contributor] as const),
  );

  return items.map((item) => {
    if (item.contributor) return item;
    const contributor = contributorsByPlaceId.get(item.id) ?? null;
    return contributor ? { ...item, contributor } : item;
  });
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

/** Grid cell size in degrees (~50 m at mid-latitudes). */
const DUPLICATE_GRID_CELL_DEG = 0.00045;

function duplicateGridKey(latitude: number, longitude: number): string {
  const row = Math.floor(latitude / DUPLICATE_GRID_CELL_DEG);
  const col = Math.floor(longitude / DUPLICATE_GRID_CELL_DEG);
  return `${row}:${col}`;
}

function duplicateNeighborGridKeys(latitude: number, longitude: number): string[] {
  const row = Math.floor(latitude / DUPLICATE_GRID_CELL_DEG);
  const col = Math.floor(longitude / DUPLICATE_GRID_CELL_DEG);
  const keys: string[] = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      keys.push(`${row + rowOffset}:${col + colOffset}`);
    }
  }
  return keys;
}

/** Mark newer nearby places as duplicates of the oldest place in each cluster. */
export function detectDuplicatePlaceIds(places: PlaceCoord[]): Map<string, string> {
  const sorted = [...places].sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt));
  const duplicates = new Map<string, string>();
  const buckets = new Map<string, PlaceCoord[]>();

  for (const current of sorted) {
    const candidates: PlaceCoord[] = [];
    for (const key of duplicateNeighborGridKeys(current.latitude, current.longitude)) {
      const bucket = buckets.get(key);
      if (bucket) candidates.push(...bucket);
    }

    candidates.sort((left, right) => createdAtMs(left.createdAt) - createdAtMs(right.createdAt));

    for (const earlier of candidates) {
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

    const bucketKey = duplicateGridKey(current.latitude, current.longitude);
    const bucket = buckets.get(bucketKey) ?? [];
    bucket.push(current);
    buckets.set(bucketKey, bucket);
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

/** Serialize a DB place row for Studio API responses (parsed tags, resolved photo). */
export function formatStudioPlaceListItem(
  place: Place,
  duplicateOfId: string | null,
  contributor: StudioContributor | null,
): StudioPlaceListItem {
  const serialized = serializePlaceForApi(place);
  return {
    ...serialized,
    createdById: normalizeCreatedById(place.createdById),
    studioStatus: studioStatusForPlace(place, duplicateOfId),
    duplicateOfId,
    contributor,
  };
}

function matchesStudioStatusFilter(
  studioStatus: StudioPlaceStatus,
  status: StudioPlacesQuery['status'],
): boolean {
  if (status === 'all') return true;
  if (status === 'verified') return studioStatus === 'verified';
  if (status === 'pending') return studioStatus === 'pending';
  return studioStatus === 'duplicate';
}

interface PlaceIndexRow {
  id: string;
  latitude: number;
  longitude: number;
  createdAt: string | Date;
  status: Place['status'];
}

async function loadPlaceIndexRows(db: Db, q?: string): Promise<PlaceIndexRow[]> {
  const columns = {
    id: placesTable.id,
    latitude: placesTable.latitude,
    longitude: placesTable.longitude,
    createdAt: placesTable.createdAt,
    status: placesTable.status,
  };

  if (q) {
    const pattern = `%${q}%`;
    return db
      .select(columns)
      .from(placesTable)
      .where(
        or(
          like(placesTable.name, pattern),
          like(placesTable.address, pattern),
          like(placesTable.slug, pattern),
        ),
      )
      .orderBy(desc(placesTable.createdAt));
  }

  return db.select(columns).from(placesTable).orderBy(desc(placesTable.createdAt));
}

export async function listStudioPlaces(
  db: Db,
  query: StudioPlacesQuery,
): Promise<StudioPlacesPage> {
  const indexRows = await loadPlaceIndexRows(db, query.q);

  const filteredIds: string[] = [];
  for (const row of indexRows) {
    const studioStatus = studioStatusForPlace(row as Place, null);
    if (matchesStudioStatusFilter(studioStatus, query.status)) {
      filteredIds.push(row.id);
    }
  }

  const total = filteredIds.length;
  const offset = (query.page - 1) * query.limit;
  const pageIds = filteredIds.slice(offset, offset + query.limit);

  if (pageIds.length === 0) {
    return { items: [], total, page: query.page, limit: query.limit };
  }

  const pageRows = await loadStudioPlacesWithContributors(db, pageIds);

  const rowsById = new Map(pageRows.map((row) => [row.place.id, row]));
  const items = pageIds
    .map((id) => rowsById.get(id))
    .filter((row): row is (typeof pageRows)[number] => row != null)
    .map((row) => formatStudioPlaceListItem(row.place, null, row.contributor));

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function listStudioDuplicatePlaces(
  db: Db,
  query: StudioDuplicatesQuery,
): Promise<StudioPlacesPage> {
  const indexRows = await loadPlaceIndexRows(db, query.q);
  const duplicateMap = detectDuplicatePlaceIds(indexRows);

  const duplicateIds = indexRows
    .filter((row) => duplicateMap.has(row.id))
    .map((row) => row.id);

  const total = duplicateIds.length;
  const offset = (query.page - 1) * query.limit;
  const pageIds = duplicateIds.slice(offset, offset + query.limit);

  if (pageIds.length === 0) {
    return { items: [], total, page: query.page, limit: query.limit };
  }

  const pageRows = await loadStudioPlacesWithContributors(db, pageIds);
  const rowsById = new Map(pageRows.map((row) => [row.place.id, row]));
  const items = pageIds
    .map((id) => rowsById.get(id))
    .filter((row): row is (typeof pageRows)[number] => row != null)
    .map((row) =>
      formatStudioPlaceListItem(
        row.place,
        duplicateMap.get(row.place.id) ?? null,
        row.contributor,
      ),
    );

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getStudioStats(db: Db): Promise<StudioStats> {
  const countRows = await db
    .select({
      status: placesTable.status,
      count: sql<number>`count(*)`,
    })
    .from(placesTable)
    .groupBy(placesTable.status);

  let totalVerified = 0;
  let pendingValidation = 0;
  for (const row of countRows) {
    const count = Number(row.count);
    if (row.status === 'PUBLISHED') totalVerified += count;
    if (row.status === 'DRAFT') pendingValidation += count;
  }

  return {
    totalVerified,
    pendingValidation,
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
  const place = rows[0];
  if (!place) return null;

  const [loaded] = await loadStudioPlacesWithContributors(db, [place.id]);
  const contributor = loaded?.contributor ?? null;

  return formatStudioPlaceListItem(place, null, contributor);
}
