import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { places as placesTable } from '@freshy/db';
import type { AppEnv } from './env';
import { createUserPlace } from './create-place';
import { serializePlaceForApi } from './places';
import { parseCreatePlaceFields, resolvePlaceCoordinates } from './place-submission';
import { uploadPlacePhoto } from './place-photo-upload';
import { isR2Configured, r2ContextFromEnv } from './storage/r2';

export async function handleCreatePlace(
  c: Context<AppEnv>,
  userId: string,
  body: Record<string, unknown>,
  photo?: File,
) {
  const r2 = r2ContextFromEnv(c.env);
  if (photo && !isR2Configured(r2)) {
    return c.json({ error: 'Photo upload is not configured on the server.' }, 503);
  }

  const parsed = parseCreatePlaceFields(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  const coords = await resolvePlaceCoordinates(parsed.data, c.env.MAPBOX_ACCESS_TOKEN);
  if ('error' in coords) {
    return c.json({ error: coords.error }, 400);
  }

  const place = await createUserPlace(c.get('db'), userId, {
    ...parsed.data,
    status: 'DRAFT',
    latitude: coords.latitude,
    longitude: coords.longitude,
  });

  if (photo) {
    const buffer = await photo.arrayBuffer();
    const photoUrl = await uploadPlacePhoto(place.slug, buffer, photo.type, r2!);
    const now = new Date().toISOString();
    await c
      .get('db')
      .update(placesTable)
      .set({ photoUrl, updatedAt: now })
      .where(eq(placesTable.id, place.id));
    const updated = { ...place, photoUrl };
    return c.json({ data: serializePlaceForApi(updated) }, 201);
  }

  return c.json({ data: serializePlaceForApi(place) }, 201);
}
