import { eq, desc, sql } from 'drizzle-orm';
import type { Place, User, Db } from '@freshy/db';
import {
  users as usersTable,
  places as placesTable,
  reviews as reviewsTable,
  savedPlaces as savedPlacesTable,
} from '@freshy/db';
import { buildClerkClient } from './auth';

function slugifyUsername(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return base || 'freshy_user';
}

async function uniqueUsername(db: Db, base: string): Promise<string> {
  let username = base;
  let suffix = 0;
  while (true) {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (existing.length === 0) break;
    suffix += 1;
    username = `${base}_${suffix}`.slice(0, 30);
  }
  return username;
}

/** Find or create a Freshy user row for a Clerk account. */
export async function syncUserFromClerk(
  db: Db,
  clerkUserId: string,
  secretKey: string,
): Promise<User> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);
  if (existing[0]) return existing[0];

  const clerk = buildClerkClient(secretKey);
  const clerkUser = await clerk.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  if (!email) {
    throw new Error('Clerk user has no primary email');
  }

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    clerkUser.username ||
    email.split('@')[0] ||
    'Freshy User';

  const usernameBase = slugifyUsername(clerkUser.username ?? email.split('@')[0] ?? 'freshy_user');
  const username = await uniqueUsername(db, usernameBase);

  const byEmail = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (byEmail[0]) {
    const now = new Date().toISOString();
    await db
      .update(usersTable)
      .set({
        clerkId: clerkUserId,
        displayName,
        avatarUrl: clerkUser.imageUrl ?? byEmail[0].avatarUrl,
        updatedAt: now,
      })
      .where(eq(usersTable.id, byEmail[0].id));
    const updated = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, byEmail[0].id))
      .limit(1);
    return updated[0]!;
  }

  const now = new Date().toISOString();
  await db.insert(usersTable).values({
    id: crypto.randomUUID(),
    clerkId: clerkUserId,
    email,
    displayName,
    username,
    avatarUrl: clerkUser.imageUrl ?? null,
    updatedAt: now,
  });
  const created = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);
  return created[0]!;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  reliefPoints: number;
  reviewCount: number;
  savedCount: number;
}

export async function getUserProfile(db: Db, userId: string): Promise<UserProfile> {
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) throw new Error('User not found');

  const [reviewCount, savedCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(reviewsTable)
      .where(eq(reviewsTable.userId, userId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(savedPlacesTable)
      .where(eq(savedPlacesTable.userId, userId)),
  ]);

  return {
    id: user[0].id,
    email: user[0].email,
    displayName: user[0].displayName,
    username: user[0].username,
    avatarUrl: user[0].avatarUrl,
    reliefPoints: user[0].reliefPoints,
    reviewCount: Number(reviewCount[0]?.count ?? 0),
    savedCount: Number(savedCount[0]?.count ?? 0),
  };
}

export async function listSavedPlaces(db: Db, userId: string): Promise<Place[]> {
  const rows = await db
    .select({ place: placesTable })
    .from(savedPlacesTable)
    .innerJoin(placesTable, eq(savedPlacesTable.placeId, placesTable.id))
    .where(eq(savedPlacesTable.userId, userId))
    .orderBy(desc(savedPlacesTable.createdAt));
  return rows.map((r) => r.place);
}

export async function isPlaceSaved(db: Db, userId: string, placeId: string): Promise<boolean> {
  const found = await db
    .select({ id: savedPlacesTable.id })
    .from(savedPlacesTable)
    .where(sql`${savedPlacesTable.userId} = ${userId} AND ${savedPlacesTable.placeId} = ${placeId}`)
    .limit(1);
  return found.length > 0;
}

export async function savePlace(db: Db, userId: string, placeId: string): Promise<void> {
  const existing = await db
    .select({ id: savedPlacesTable.id })
    .from(savedPlacesTable)
    .where(sql`${savedPlacesTable.userId} = ${userId} AND ${savedPlacesTable.placeId} = ${placeId}`)
    .limit(1);
  if (existing.length === 0) {
    await db.insert(savedPlacesTable).values({
      id: crypto.randomUUID(),
      userId,
      placeId,
    });
  }
}

export async function unsavePlace(db: Db, userId: string, placeId: string): Promise<void> {
  await db
    .delete(savedPlacesTable)
    .where(
      sql`${savedPlacesTable.userId} = ${userId} AND ${savedPlacesTable.placeId} = ${placeId}`,
    );
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

export async function listUserReviews(db: Db, userId: string): Promise<UserReviewItem[]> {
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
    .where(eq(reviewsTable.userId, userId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(10);

  return rows.map((row) => ({
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
  }));
}
