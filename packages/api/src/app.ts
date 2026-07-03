import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import { createDb, places as placesTable } from '@freshy/db';
import type { AppEnv } from './env';
import { isClerkConfigured } from './auth';
import { buildHealthSnapshot, checkDatabaseHealth } from './health';
import { isR2Configured, r2ContextFromEnv } from './storage/r2';
import {
  categoryCounts,
  featuredPlace,
  getPlaceBySlugWithReviews,
  listCategoryPlacesPage,
  listDraftPlaces,
  listPlaces,
  categoryPlacesQuerySchema,
  placesQuerySchema,
} from './places';
import { registerUserRoutes } from './user-routes';
import { registerContributionRoutes } from './contribution-routes';
import { registerStudioRoutes } from './studio-routes';

/** Paths that must never be handled by GET /places/:slug. */
const RESERVED_PLACE_PATHS = new Set(['drafts', 'category-list', 'meta']);

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use('*', cors());
  app.use('*', async (c, next) => {
    c.set('db', createDb(c.env.FRESHY_DB));
    await next();
  });

  app.get('/', (c) => c.redirect('/health', 302));

  app.get('/health', async (c) => {
    const db = c.get('db');
    const dbStatus = await checkDatabaseHealth(async () => {
      const rows = await db
        .select({ id: placesTable.id })
        .from(placesTable)
        .where(eq(placesTable.status, 'PUBLISHED'))
        .limit(1);
      return rows[0] ?? null;
    });
    const r2 = r2ContextFromEnv(c.env);
    return c.json(buildHealthSnapshot(dbStatus, isR2Configured(r2), isClerkConfigured(c.env)));
  });

  app.get('/places', async (c) => {
    try {
      const parsed = placesQuerySchema.safeParse({
        lat: c.req.query('lat'),
        lng: c.req.query('lng'),
        radius: c.req.query('radius'),
        category: c.req.query('category'),
        q: c.req.query('q'),
        verifiedOnly: c.req.query('verifiedOnly'),
        minFreshnessLevel: c.req.query('minFreshnessLevel'),
      });
      if (!parsed.success) {
        return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
      }
      const data = await listPlaces(c.get('db'), parsed.data);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  /** Pending places in a map area (non-PUBLISHED). Kept for older clients; Explore uses GET /places. */
  app.get('/places/drafts', async (c) => {
    try {
      const parsed = placesQuerySchema.safeParse({
        lat: c.req.query('lat'),
        lng: c.req.query('lng'),
        radius: c.req.query('radius'),
        category: c.req.query('category'),
        q: c.req.query('q'),
        minFreshnessLevel: c.req.query('minFreshnessLevel'),
      });
      if (!parsed.success) {
        return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
      }
      const data = await listDraftPlaces(c.get('db'), parsed.data);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/places/category-list', async (c) => {
    try {
      const parsed = categoryPlacesQuerySchema.safeParse({
        lat: c.req.query('lat'),
        lng: c.req.query('lng'),
        radius: c.req.query('radius'),
        category: c.req.query('category'),
        page: c.req.query('page'),
        limit: c.req.query('limit'),
        q: c.req.query('q'),
        verifiedOnly: c.req.query('verifiedOnly'),
        minFreshnessLevel: c.req.query('minFreshnessLevel'),
      });
      if (!parsed.success) {
        return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
      }
      const data = await listCategoryPlacesPage(c.get('db'), parsed.data);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/places/meta/categories', async (c) => {
    try {
      const [categories, featured] = await Promise.all([
        categoryCounts(c.get('db')),
        featuredPlace(c.get('db')),
      ]);
      return c.json({ data: { categories, featured } });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/places/:slug', async (c) => {
    const slug = c.req.param('slug');
    if (RESERVED_PLACE_PATHS.has(slug)) {
      return c.json({ error: 'Not found' }, 404);
    }
    try {
      const place = await getPlaceBySlugWithReviews(c.get('db'), slug);
      if (!place) {
        return c.json({ error: 'Place not found' }, 404);
      }
      return c.json({ data: place });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  registerUserRoutes(app);
  registerContributionRoutes(app);
  registerStudioRoutes(app);

  return app;
}

export const app = createApp();
