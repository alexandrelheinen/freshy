import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { PLACE_TAG_IDS } from '@freshy/config/place-tags';
import { FRESHNESS_LEVEL_IDS } from '@freshy/config/freshness-levels';
import { PLACE_CATEGORIES, type Place, type FreshnessLevel, type Db } from '@freshy/db';
import { places as placesTable } from '@freshy/db';

export const createPlaceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(PLACE_CATEGORIES),
  address: z.string().trim().min(3).max(240),
  description: z.string().trim().max(1000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  aggregatedFreshnessLevel: z.enum(FRESHNESS_LEVEL_IDS as [string, ...string[]]),
  tags: z.array(z.enum(PLACE_TAG_IDS as [string, ...string[]])).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
  photoUrl: z.string().url().optional(),
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export function slugifyPlaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uniquePlaceSlug(db: Db, base: string): Promise<string> {
  let slug = base || 'place';
  let suffix = 0;
  while (true) {
    const existing = await db
      .select({ id: placesTable.id })
      .from(placesTable)
      .where(eq(placesTable.slug, slug))
      .limit(1);
    if (existing.length === 0) break;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function createUserPlace(
  db: Db,
  userId: string,
  input: CreatePlaceInput & { latitude: number; longitude: number },
): Promise<Place> {
  const baseSlug = slugifyPlaceName(input.name);
  const slug = await uniquePlaceSlug(db, baseSlug);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(placesTable).values({
    id,
    slug,
    name: input.name,
    description: input.description ?? null,
    category: input.category,
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address,
    photoUrl: input.photoUrl ?? null,
    aggregatedFreshnessLevel: input.aggregatedFreshnessLevel as FreshnessLevel,
    tags: JSON.stringify(input.tags),
    status: input.status,
    createdById: userId,
    updatedAt: now,
  });

  const rows = await db
    .select()
    .from(placesTable)
    .where(eq(placesTable.id, id))
    .limit(1);
  return rows[0]!;
}
