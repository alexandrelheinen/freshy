import type { Place } from '@freshy/db';
import type { User } from '@freshy/db';
import type { PrismaClient } from '@freshy/db';
import { getClerkClient } from './auth';

function slugifyUsername(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return base || 'freshy_user';
}

async function uniqueUsername(prisma: PrismaClient, base: string): Promise<string> {
  let username = base;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${base}_${suffix}`.slice(0, 30);
  }
  return username;
}

/** Find or create a Freshy user row for a Clerk account. */
export async function syncUserFromClerk(prisma: PrismaClient, clerkUserId: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (existing) {
    return existing;
  }

  const clerk = getClerkClient();
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
  const username = await uniqueUsername(prisma, usernameBase);

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        clerkId: clerkUserId,
        displayName,
        avatarUrl: clerkUser.imageUrl ?? byEmail.avatarUrl,
      },
    });
  }

  return prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email,
      displayName,
      username,
      avatarUrl: clerkUser.imageUrl ?? null,
    },
  });
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

export async function getUserProfile(prisma: PrismaClient, userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      _count: { select: { reviews: true, savedPlaces: true } },
    },
  });

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    reliefPoints: user.reliefPoints,
    reviewCount: user._count.reviews,
    savedCount: user._count.savedPlaces,
  };
}

export async function listSavedPlaces(prisma: PrismaClient, userId: string): Promise<Place[]> {
  const rows = await prisma.savedPlace.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { place: true },
  });
  return rows.map((row) => row.place);
}

export async function isPlaceSaved(
  prisma: PrismaClient,
  userId: string,
  placeId: string,
): Promise<boolean> {
  const row = await prisma.savedPlace.findUnique({
    where: { userId_placeId: { userId, placeId } },
  });
  return row != null;
}

export async function savePlace(
  prisma: PrismaClient,
  userId: string,
  placeId: string,
): Promise<void> {
  await prisma.savedPlace.upsert({
    where: { userId_placeId: { userId, placeId } },
    update: {},
    create: { userId, placeId },
  });
}

export async function unsavePlace(
  prisma: PrismaClient,
  userId: string,
  placeId: string,
): Promise<void> {
  await prisma.savedPlace.deleteMany({ where: { userId, placeId } });
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

export async function listUserReviews(
  prisma: PrismaClient,
  userId: string,
): Promise<UserReviewItem[]> {
  const rows = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      place: { select: { id: true, slug: true, name: true, category: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    comment: row.comment,
    acStrength: row.acStrength,
    createdAt: row.createdAt.toISOString(),
    place: row.place,
  }));
}
