import { z } from 'zod';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import type { Db } from '@freshy/db';
import { places as placesTable, reviews as reviewsTable, users as usersTable } from '@freshy/db';

export const REVIEW_PAGE_SIZE = 5;
export const STUDIO_REVIEW_PAGE_SIZE = 25;
export const REVIEW_COMMENT_MAX_LENGTH = 2000;

export const reviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(20).optional().default(REVIEW_PAGE_SIZE),
});

export type ReviewsQuery = z.infer<typeof reviewsQuerySchema>;

export const studioReviewsQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(STUDIO_REVIEW_PAGE_SIZE),
});

export type StudioReviewsQuery = z.infer<typeof studioReviewsQuerySchema>;

export const createReviewSchema = z.object({
  acStrength: z.coerce.number().int().min(1).max(5),
  comment: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((value) => value === null || value.length <= REVIEW_COMMENT_MAX_LENGTH, {
      message: `Comment must be at most ${REVIEW_COMMENT_MAX_LENGTH} characters`,
    }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const upsertReviewSchema = createReviewSchema.extend({
  placeId: z.string().trim().min(1),
});

export type UpsertReviewInput = z.infer<typeof upsertReviewSchema>;

export interface ReviewPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PlaceReviewSummary {
  id: string;
  acStrength: number;
  comment: string | null;
  createdAt: string;
  user: { displayName: string; username: string; avatarUrl: string | null };
}

export interface UserReviewItem {
  id: string;
  comment: string | null;
  acStrength: number;
  createdAt: string;
  place: {
    id: string;
    slug: string;
    name: string;
    category: string;
  };
}

export interface StudioReviewItem {
  id: string;
  comment: string | null;
  acStrength: number;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  place: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface PlaceReviewRow {
  id: string;
  acStrength: number;
  comment: string | null;
  createdAt: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export function toReviewPage<T>(
  items: readonly T[],
  query: Pick<ReviewsQuery, 'page' | 'limit'>,
): ReviewPage<T> {
  const offset = (query.page - 1) * query.limit;
  return {
    items: items.slice(offset, offset + query.limit),
    total: items.length,
    page: query.page,
    limit: query.limit,
  };
}

export function serializePlaceReview(row: PlaceReviewRow): PlaceReviewSummary {
  return {
    id: row.id,
    acStrength: row.acStrength,
    comment: row.comment,
    createdAt: row.createdAt,
    user: {
      displayName: row.displayName,
      username: row.username,
      avatarUrl: row.avatarUrl,
    },
  };
}

async function countReviews(
  db: Db,
  where: ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or> | undefined,
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviewsTable)
    .where(where);
  return Number(rows[0]?.count ?? 0);
}

export async function listPlaceReviews(
  db: Db,
  placeId: string,
  query: ReviewsQuery,
): Promise<ReviewPage<PlaceReviewSummary>> {
  const offset = (query.page - 1) * query.limit;
  const [total, reviewRows] = await Promise.all([
    countReviews(db, eq(reviewsTable.placeId, placeId)),
    db
      .select({
        id: reviewsTable.id,
        acStrength: reviewsTable.acStrength,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        displayName: usersTable.displayName,
        username: usersTable.username,
        avatarUrl: usersTable.avatarUrl,
      })
      .from(reviewsTable)
      .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(eq(reviewsTable.placeId, placeId))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(query.limit)
      .offset(offset),
  ]);

  return {
    items: reviewRows.map(serializePlaceReview),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function listPlaceReviewsBySlug(
  db: Db,
  slug: string,
  query: ReviewsQuery,
): Promise<ReviewPage<PlaceReviewSummary> | null> {
  const placeRows = await db
    .select({ id: placesTable.id })
    .from(placesTable)
    .where(eq(placesTable.slug, slug))
    .limit(1);
  if (!placeRows[0]) return null;
  return listPlaceReviews(db, placeRows[0].id, query);
}

export async function listUserReviews(
  db: Db,
  userId: string,
  query: ReviewsQuery = { page: 1, limit: REVIEW_PAGE_SIZE },
): Promise<ReviewPage<UserReviewItem>> {
  const offset = (query.page - 1) * query.limit;
  const [total, rows] = await Promise.all([
    countReviews(db, eq(reviewsTable.userId, userId)),
    db
      .select({
        id: reviewsTable.id,
        comment: reviewsTable.comment,
        acStrength: reviewsTable.acStrength,
        createdAt: reviewsTable.createdAt,
        placeId: placesTable.id,
        placeSlug: placesTable.slug,
        placeName: placesTable.name,
        placeCategory: placesTable.category,
      })
      .from(reviewsTable)
      .innerJoin(placesTable, eq(reviewsTable.placeId, placesTable.id))
      .where(eq(reviewsTable.userId, userId))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(query.limit)
      .offset(offset),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      comment: row.comment,
      acStrength: row.acStrength,
      createdAt: row.createdAt,
      place: {
        id: row.placeId,
        slug: row.placeSlug,
        name: row.placeName,
        category: row.placeCategory,
      },
    })),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getUserReviewForPlace(
  db: Db,
  userId: string,
  placeId: string,
): Promise<UserReviewItem | null> {
  const rows = await db
    .select({
      id: reviewsTable.id,
      comment: reviewsTable.comment,
      acStrength: reviewsTable.acStrength,
      createdAt: reviewsTable.createdAt,
      placeId: placesTable.id,
      placeSlug: placesTable.slug,
      placeName: placesTable.name,
      placeCategory: placesTable.category,
    })
    .from(reviewsTable)
    .innerJoin(placesTable, eq(reviewsTable.placeId, placesTable.id))
    .where(and(eq(reviewsTable.userId, userId), eq(reviewsTable.placeId, placeId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    comment: row.comment,
    acStrength: row.acStrength,
    createdAt: row.createdAt,
    place: {
      id: row.placeId,
      slug: row.placeSlug,
      name: row.placeName,
      category: row.placeCategory,
    },
  };
}

export class ReviewPlaceNotFoundError extends Error {
  constructor() {
    super('Place not found');
    this.name = 'ReviewPlaceNotFoundError';
  }
}

export async function upsertUserReview(
  db: Db,
  userId: string,
  placeId: string,
  input: CreateReviewInput,
): Promise<{ review: UserReviewItem; created: boolean }> {
  const placeRows = await db
    .select({
      id: placesTable.id,
      slug: placesTable.slug,
      name: placesTable.name,
      category: placesTable.category,
    })
    .from(placesTable)
    .where(eq(placesTable.id, placeId))
    .limit(1);
  if (!placeRows[0]) {
    throw new ReviewPlaceNotFoundError();
  }

  const existing = await db
    .select({ id: reviewsTable.id, createdAt: reviewsTable.createdAt })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.userId, userId), eq(reviewsTable.placeId, placeId)))
    .limit(1);

  const place = {
    id: placeRows[0].id,
    slug: placeRows[0].slug,
    name: placeRows[0].name,
    category: placeRows[0].category,
  };

  if (existing[0]) {
    await db
      .update(reviewsTable)
      .set({
        acStrength: input.acStrength,
        comment: input.comment,
      })
      .where(eq(reviewsTable.id, existing[0].id));
    return {
      created: false,
      review: {
        id: existing[0].id,
        comment: input.comment,
        acStrength: input.acStrength,
        createdAt: existing[0].createdAt,
        place,
      },
    };
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.insert(reviewsTable).values({
    id,
    userId,
    placeId,
    acStrength: input.acStrength,
    comment: input.comment,
    createdAt,
  });

  return {
    created: true,
    review: {
      id,
      comment: input.comment,
      acStrength: input.acStrength,
      createdAt,
      place,
    },
  };
}

function studioReviewSearchCondition(query: string) {
  const pattern = `%${query}%`;
  return or(
    like(reviewsTable.comment, pattern),
    like(usersTable.displayName, pattern),
    like(usersTable.username, pattern),
    like(placesTable.name, pattern),
  );
}

export async function listStudioReviews(
  db: Db,
  query: StudioReviewsQuery,
): Promise<ReviewPage<StudioReviewItem>> {
  const offset = (query.page - 1) * query.limit;
  const search = query.q ? studioReviewSearchCondition(query.q) : undefined;

  const countRows = search
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(reviewsTable)
        .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
        .innerJoin(placesTable, eq(reviewsTable.placeId, placesTable.id))
        .where(search)
    : await db.select({ count: sql<number>`count(*)` }).from(reviewsTable);

  const total = Number(countRows[0]?.count ?? 0);

  const listQuery = db
    .select({
      id: reviewsTable.id,
      comment: reviewsTable.comment,
      acStrength: reviewsTable.acStrength,
      createdAt: reviewsTable.createdAt,
      userId: usersTable.id,
      displayName: usersTable.displayName,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      placeId: placesTable.id,
      placeSlug: placesTable.slug,
      placeName: placesTable.name,
    })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .innerJoin(placesTable, eq(reviewsTable.placeId, placesTable.id));

  const rows = await (search ? listQuery.where(search) : listQuery)
    .orderBy(desc(reviewsTable.createdAt))
    .limit(query.limit)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      comment: row.comment,
      acStrength: row.acStrength,
      createdAt: row.createdAt,
      user: {
        id: row.userId,
        displayName: row.displayName,
        username: row.username,
        avatarUrl: row.avatarUrl,
      },
      place: {
        id: row.placeId,
        slug: row.placeSlug,
        name: row.placeName,
      },
    })),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function deleteStudioReview(db: Db, reviewId: string): Promise<boolean> {
  const existing = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(eq(reviewsTable.id, reviewId))
    .limit(1);
  if (!existing[0]) return false;
  await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
  return true;
}
