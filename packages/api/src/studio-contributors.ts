import type { Db, Place } from '@freshy/db';
import { eq, inArray } from 'drizzle-orm';
import { places as placesTable, users as usersTable } from '@freshy/db';
import { getStudioUsersByIds, type StudioUserProfile } from './studio-users';

export interface StudioContributor {
  id: string;
  email: string;
  displayName: string;
  username: string;
}

/** Synthetic profiles for seeder import accounts (User.id = provider key). */
export const IMPORT_PROVIDER_CONTRIBUTORS: Record<string, StudioContributor> = {
  osm: {
    id: 'osm',
    email: 'osm@import.freshy',
    displayName: 'OpenStreetMap Import',
    username: 'osm-import',
  },
  datagouv: {
    id: 'datagouv',
    email: 'datagouv@import.freshy',
    displayName: 'data.gouv Import',
    username: 'datagouv-import',
  },
};

export function normalizeCreatedById(createdById: string | null | undefined): string | null {
  if (createdById == null) return null;
  const trimmed = createdById.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function contributorFromProfile(profile: StudioUserProfile): StudioContributor {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    username: profile.username,
  };
}

export function syntheticContributorForProviderId(userId: string): StudioContributor | null {
  return IMPORT_PROVIDER_CONTRIBUTORS[userId] ?? null;
}

export async function buildContributorMap(
  db: Db,
  createdByIds: Array<string | null | undefined>,
): Promise<Map<string, StudioContributor>> {
  const normalized = [
    ...new Set(
      createdByIds.map((id) => normalizeCreatedById(id)).filter((id): id is string => id != null),
    ),
  ];

  const map = new Map<string, StudioContributor>();
  if (normalized.length === 0) return map;

  const profiles = await getStudioUsersByIds(db, normalized);
  for (const profile of profiles) {
    map.set(profile.id, contributorFromProfile(profile));
  }

  for (const id of normalized) {
    if (map.has(id)) continue;
    const synthetic = syntheticContributorForProviderId(id);
    if (synthetic) {
      map.set(id, synthetic);
    }
  }

  return map;
}

export function contributorForCreatedById(
  createdById: string | null | undefined,
  contributors: Map<string, StudioContributor>,
): StudioContributor | null {
  const normalized = normalizeCreatedById(createdById);
  if (!normalized) return null;
  return contributors.get(normalized) ?? syntheticContributorForProviderId(normalized);
}

interface JoinedUserRow {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  username: string | null;
}

export function joinedUserProfile(row: JoinedUserRow): StudioUserProfile | null {
  if (!row.userId || !row.email || !row.displayName || !row.username) return null;
  return {
    id: row.userId,
    email: row.email,
    displayName: row.displayName,
    username: row.username,
  };
}

export function contributorFromJoinedUser(
  createdById: string | null | undefined,
  user: StudioUserProfile | null,
): StudioContributor | null {
  if (user?.id) {
    return contributorFromProfile(user);
  }
  const normalized = normalizeCreatedById(createdById);
  if (!normalized) return null;
  return syntheticContributorForProviderId(normalized);
}

export interface StudioPlaceWithContributor {
  place: Place;
  contributor: StudioContributor | null;
}

/** Load places and contributor profiles in one query (Place LEFT JOIN User). */
export async function loadStudioPlacesWithContributors(
  db: Db,
  placeIds: string[],
): Promise<StudioPlaceWithContributor[]> {
  const ids = [...new Set(placeIds.filter(Boolean))];
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      place: placesTable,
      userId: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      username: usersTable.username,
    })
    .from(placesTable)
    .leftJoin(usersTable, eq(placesTable.createdById, usersTable.id))
    .where(inArray(placesTable.id, ids));

  return rows.map((row) => ({
    place: row.place,
    contributor: contributorFromJoinedUser(row.place.createdById, joinedUserProfile(row)),
  }));
}
