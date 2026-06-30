import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Enums (stored as TEXT in SQLite) ─────────────────────────────────────────

export const PLACE_CATEGORIES = [
  'CAFE',
  'RESTAURANT',
  'BAR',
  'LIBRARY',
  'MALL',
  'MUSEUM',
  'COWORKING',
  'PUBLIC_SPACE',
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const FRESHNESS_LEVELS = [
  'NONE',
  'GOOD_VENTILATION',
  'MODEST_AC',
  'VERY_COLD_AC',
  'NATURALLY_FRESH',
] as const;
export type FreshnessLevel = (typeof FRESHNESS_LEVELS)[number];

export const PLACE_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type PlaceStatus = (typeof PLACE_STATUSES)[number];

// ── Tables ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('User', {
  id: text('id').notNull().primaryKey(),
  clerkId: text('clerkId').unique(),
  email: text('email').notNull().unique(),
  displayName: text('displayName').notNull(),
  username: text('username').notNull().unique(),
  avatarUrl: text('avatarUrl'),
  reliefPoints: integer('reliefPoints').notNull().default(0),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull(),
});

export const places = sqliteTable(
  'Place',
  {
    id: text('id').notNull().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    category: text('category').$type<PlaceCategory>().notNull(),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    address: text('address'),
    photoUrl: text('photoUrl'),
    aggregatedFreshnessLevel: text('aggregatedFreshnessLevel').$type<FreshnessLevel>(),
    /** JSON-encoded string array, e.g. '["wifi","outdoor"]' */
    tags: text('tags').notNull().default('[]'),
    isOpen: integer('isOpen', { mode: 'boolean' }).notNull().default(true),
    createdById: text('createdById').references(() => users.id, { onDelete: 'set null' }),
    status: text('status').$type<PlaceStatus>().notNull().default('PUBLISHED'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [
    index('Place_category_idx').on(t.category),
    index('Place_latitude_longitude_idx').on(t.latitude, t.longitude),
    index('Place_createdById_idx').on(t.createdById),
  ],
);

export const reviews = sqliteTable(
  'Review',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    placeId: text('placeId')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    acStrength: integer('acStrength').notNull(),
    comment: text('comment'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index('Review_placeId_idx').on(t.placeId), index('Review_userId_idx').on(t.userId)],
);

export const savedPlaces = sqliteTable(
  'SavedPlace',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    placeId: text('placeId')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex('SavedPlace_userId_placeId_key').on(t.userId, t.placeId)],
);

// ── Inferred row types ────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type SavedPlace = typeof savedPlaces.$inferSelect;
export type NewSavedPlace = typeof savedPlaces.$inferInsert;
