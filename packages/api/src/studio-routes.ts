import type { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { places as placesTable } from '@freshy/db';
import type { AppEnv } from './env';
import { requireAdmin } from './auth';
import { uploadPlacePhoto } from './place-photo-upload';
import { isR2Configured, r2ContextFromEnv } from './storage/r2';
import { photoFromFormData, requireParam } from './route-utils';
import {
  approveStudioPlace,
  deleteStudioPlace,
  getStudioPlace,
  getStudioStats,
  listStudioDuplicatePlaces,
  listStudioPlaces,
  mergePlacesSchema,
  mergeStudioPlaces,
  parseUpdateStudioPlaceFields,
  studioDuplicatesQuerySchema,
  studioPlacesQuerySchema,
  updateStudioPlace,
  updateStudioPlaceSchema,
} from './studio-places';
import {
  getStudioUser,
  getStudioUserSecret,
  getStudioUsersByIds,
  listStudioUsers,
  studioUsersLookupSchema,
  studioUsersQuerySchema,
} from './studio-users';

export function registerStudioRoutes(app: Hono<AppEnv>): void {
  app.get('/studio/stats', requireAdmin, async (c) => {
    try {
      const data = await getStudioStats(c.get('db'));
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/studio/users', requireAdmin, async (c) => {
    const parsed = studioUsersQuerySchema.safeParse({
      q: c.req.query('q'),
      limit: c.req.query('limit'),
    });
    if (!parsed.success) {
      return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
    }
    try {
      const data = await listStudioUsers(c.get('db'), parsed.data);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/studio/users/lookup', requireAdmin, async (c) => {
    const parsed = studioUsersLookupSchema.safeParse({
      ids: c.req.query('ids'),
    });
    if (!parsed.success) {
      return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
    }
    const userIds = parsed.data.ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    try {
      const data = await getStudioUsersByIds(c.get('db'), userIds);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/studio/users/:userId/contributor-secret', requireAdmin, async (c) => {
    const userId = requireParam(c, 'userId');
    if (userId instanceof Response) return userId;
    try {
      const data = await getStudioUserSecret(c.get('db'), userId);
      if (!data) {
        return c.json({ error: 'Not found' }, 404);
      }
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/studio/users/:userId', requireAdmin, async (c) => {
    const userId = requireParam(c, 'userId');
    if (userId instanceof Response) return userId;
    try {
      const data = await getStudioUser(c.get('db'), userId);
      if (!data) {
        return c.json({ error: 'Not found' }, 404);
      }
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/studio/places', requireAdmin, async (c) => {
    const parsed = studioPlacesQuerySchema.safeParse({
      status: c.req.query('status'),
      q: c.req.query('q'),
      category: c.req.query('category'),
      placeStatus: c.req.query('placeStatus'),
      freshnessLevel: c.req.query('freshnessLevel'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    });
    if (!parsed.success) {
      return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
    }
    try {
      const data = await listStudioPlaces(c.get('db'), parsed.data);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/studio/duplicates', requireAdmin, async (c) => {
    const parsed = studioDuplicatesQuerySchema.safeParse({
      q: c.req.query('q'),
      category: c.req.query('category'),
      placeStatus: c.req.query('placeStatus'),
      freshnessLevel: c.req.query('freshnessLevel'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    });
    if (!parsed.success) {
      return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
    }
    try {
      const data = await listStudioDuplicatePlaces(c.get('db'), parsed.data);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.get('/studio/places/:placeId', requireAdmin, async (c) => {
    const placeId = requireParam(c, 'placeId');
    if (placeId instanceof Response) return placeId;
    try {
      const data = await getStudioPlace(c.get('db'), placeId);
      if (!data) {
        return c.json({ error: 'Not found' }, 404);
      }
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.patch('/studio/places/:placeId', requireAdmin, async (c) => {
    const placeId = requireParam(c, 'placeId');
    if (placeId instanceof Response) return placeId;

    const contentType = c.req.header('content-type') ?? '';
    const isMultipart = contentType.includes('multipart/form-data');

    let parsed:
      | ReturnType<typeof parseUpdateStudioPlaceFields>
      | ReturnType<typeof updateStudioPlaceSchema.safeParse>;
    let photo: File | undefined;

    if (isMultipart) {
      const formData = await c.req.formData();
      const body: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        body[key] = typeof value === 'string' ? value : undefined;
      });
      parsed = parseUpdateStudioPlaceFields(body);
      photo = photoFromFormData(formData);
    } else {
      parsed = updateStudioPlaceSchema.safeParse(await c.req.json());
    }

    if (!parsed.success) {
      return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
    }

    try {
      const existingRows = await c
        .get('db')
        .select()
        .from(placesTable)
        .where(eq(placesTable.id, placeId))
        .limit(1);
      const existing = existingRows[0];
      if (!existing) {
        return c.json({ error: 'Not found' }, 404);
      }

      let updateInput = parsed.data;
      const r2 = r2ContextFromEnv(c.env);
      if (photo && !isR2Configured(r2)) {
        return c.json({ error: 'Photo upload is not configured on the server.' }, 503);
      }
      if (photo) {
        const uploadedPhotoUrl = await uploadPlacePhoto(
          existing.slug,
          await photo.arrayBuffer(),
          photo.type,
          r2!,
        );
        updateInput = { ...updateInput, photoUrl: uploadedPhotoUrl };
      }

      const data = await updateStudioPlace(c.get('db'), existing.id, updateInput);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.post('/studio/places/:placeId/approve', requireAdmin, async (c) => {
    const placeId = requireParam(c, 'placeId');
    if (placeId instanceof Response) return placeId;
    try {
      const existingRows = await c
        .get('db')
        .select({ id: placesTable.id })
        .from(placesTable)
        .where(eq(placesTable.id, placeId))
        .limit(1);
      if (!existingRows[0]) {
        return c.json({ error: 'Not found' }, 404);
      }
      const data = await approveStudioPlace(c.get('db'), existingRows[0].id);
      return c.json({ data });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.delete('/studio/places/:placeId', requireAdmin, async (c) => {
    const placeId = requireParam(c, 'placeId');
    if (placeId instanceof Response) return placeId;
    try {
      const existingRows = await c
        .get('db')
        .select({ id: placesTable.id })
        .from(placesTable)
        .where(eq(placesTable.id, placeId))
        .limit(1);
      if (!existingRows[0]) {
        return c.json({ error: 'Not found' }, 404);
      }
      await deleteStudioPlace(c.get('db'), existingRows[0].id);
      return c.json({ data: { deleted: true } });
    } catch {
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });

  app.post('/studio/places/merge', requireAdmin, async (c) => {
    const parsed = mergePlacesSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
    }
    try {
      const data = await mergeStudioPlaces(c.get('db'), parsed.data);
      return c.json({ data });
    } catch (error) {
      if (error instanceof Error && error.message === 'Place not found') {
        return c.json({ error: 'Not found' }, 404);
      }
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });
}
