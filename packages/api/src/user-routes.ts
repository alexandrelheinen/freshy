import type { Hono } from 'hono';
import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { places as placesTable } from '@freshy/db';
import type { AppEnv } from './env';
import { requireAuth } from './auth';
import {
  getUserProfile,
  contributorSecretForUser,
  isPlaceSaved,
  listSavedPlaces,
  savePlace,
  deleteUserAccount,
  syncUserFromClerk,
  unsavePlace,
} from './users';
import { createPlaceSchema, createUserPlace } from './create-place';
import { serializePlaceForApi } from './places';
import { resolvePlaceCoordinates } from './place-submission';
import { handleCreatePlace } from './place-create-handler';
import { photoFromFormData, requireParam } from './route-utils';
import {
  getUserReviewForPlace,
  listUserReviews,
  reviewsQuerySchema,
  ReviewPlaceNotFoundError,
  upsertReviewSchema,
  upsertUserReview,
} from './reviews';

function formValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' ? value : undefined;
}

async function withDbUser(c: Context<AppEnv>) {
  const clerkUserId = c.get('clerkUserId');
  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const secretKey = c.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return c.json({ error: 'Auth not configured' }, 503);
  }
  try {
    const user = await syncUserFromClerk(c.get('db'), clerkUserId, secretKey);
    return user;
  } catch {
    return c.json({ error: 'Could not sync user' }, 503);
  }
}

export function registerUserRoutes(app: Hono<AppEnv>): void {
  app.get('/users/me', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    try {
      const data = await getUserProfile(c.get('db'), user.id);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/users/me/contributor-secret', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    return c.json({ data: { secret: contributorSecretForUser(user) } });
  });

  app.delete('/users/me', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    const clerkUserId = c.get('clerkUserId');
    if (!clerkUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const secretKey = c.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      return c.json({ error: 'Auth not configured' }, 503);
    }
    try {
      await deleteUserAccount(c.get('db'), user.id, clerkUserId, secretKey);
      return c.json({ data: { deleted: true } });
    } catch {
      return c.json({ error: 'Could not delete account' }, 503);
    }
  });

  app.get('/users/me/reviews', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    const parsed = reviewsQuerySchema.safeParse({
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    });
    if (!parsed.success) {
      return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
    }
    const placeId = c.req.query('placeId')?.trim();
    try {
      if (placeId) {
        const review = await getUserReviewForPlace(c.get('db'), user.id, placeId);
        return c.json({
          data: {
            items: review ? [review] : [],
            total: review ? 1 : 0,
            page: 1,
            limit: 1,
          },
        });
      }
      const data = await listUserReviews(c.get('db'), user.id, parsed.data);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.post('/users/me/reviews', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid body' }, 400);
    }
    const parsed = upsertReviewSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
    }
    try {
      const { review, created } = await upsertUserReview(
        c.get('db'),
        user.id,
        parsed.data.placeId,
        { acStrength: parsed.data.acStrength, comment: parsed.data.comment },
      );
      return c.json({ data: review }, created ? 201 : 200);
    } catch (error) {
      if (error instanceof ReviewPlaceNotFoundError) {
        return c.json({ error: 'Place not found' }, 404);
      }
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.post('/users/me/places', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;

    try {
      const contentType = c.req.header('content-type') ?? '';
      if (!contentType.includes('multipart/form-data')) {
        const body = await c.req.json<Record<string, unknown>>();
        const bodyWithoutSecret = { ...body };
        delete (bodyWithoutSecret as { secret?: string }).secret;
        const parsed = createPlaceSchema.safeParse(bodyWithoutSecret);
        if (!parsed.success) {
          return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
        }
        const coords = await resolvePlaceCoordinates(parsed.data, c.env.MAPBOX_ACCESS_TOKEN);
        if ('error' in coords) {
          return c.json({ error: coords.error }, 400);
        }
        const place = await createUserPlace(c.get('db'), user.id, {
          ...parsed.data,
          status: 'DRAFT',
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        return c.json({ data: serializePlaceForApi(place) }, 201);
      }

      const formData = await c.req.formData();
      const body: Record<string, unknown> = {
        name: formValue(formData, 'name'),
        category: formValue(formData, 'category'),
        address: formValue(formData, 'address'),
        description: formValue(formData, 'description'),
        latitude: formValue(formData, 'latitude'),
        longitude: formValue(formData, 'longitude'),
        aggregatedFreshnessLevel: formValue(formData, 'aggregatedFreshnessLevel'),
        tags: formValue(formData, 'tags'),
      };
      const photo = photoFromFormData(formData);
      return handleCreatePlace(c, user.id, body, photo);
    } catch (err) {
      if (err instanceof Error && err.message !== 'R2_NOT_CONFIGURED') {
        return c.json({ error: err.message }, 400);
      }
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/users/me/saved', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    try {
      const places = await listSavedPlaces(c.get('db'), user.id);
      const data = places.map(serializePlaceForApi);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/users/me/saved/:placeId', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    const placeId = requireParam(c, 'placeId');
    if (placeId instanceof Response) return placeId;
    try {
      const saved = await isPlaceSaved(c.get('db'), user.id, placeId);
      return c.json({ data: { saved } });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.post('/users/me/saved/:placeId', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    const placeId = requireParam(c, 'placeId');
    if (placeId instanceof Response) return placeId;
    try {
      const placeRows = await c
        .get('db')
        .select({ id: placesTable.id })
        .from(placesTable)
        .where(eq(placesTable.id, placeId))
        .limit(1);
      if (!placeRows[0]) {
        return c.json({ error: 'Place not found' }, 404);
      }
      await savePlace(c.get('db'), user.id, placeRows[0].id);
      return c.json({ data: { saved: true } }, 201);
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.delete('/users/me/saved/:placeId', requireAuth, async (c) => {
    const user = await withDbUser(c);
    if (user instanceof Response) return user;
    const placeId = requireParam(c, 'placeId');
    if (placeId instanceof Response) return placeId;
    try {
      await unsavePlace(c.get('db'), user.id, placeId);
      return c.json({ data: { saved: false } });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });
}
