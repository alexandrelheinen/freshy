import type { Hono } from 'hono';
import type { AppEnv } from './env';
import { anonymousCreatePlaceSchema } from './anonymous-contribution';
import { findContributorBySecret } from './contributor';
import { createUserPlace } from './create-place';
import { withResolvedPlacePhoto } from './places';
import { resolvePlaceCoordinates } from './place-submission';
import { handleCreatePlace } from './place-create-handler';
import { photoFromFormData } from './route-utils';

function formValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' ? value : undefined;
}

export function registerContributionRoutes(app: Hono<AppEnv>): void {
  app.post('/contributions/places', async (c) => {
    try {
      const contentType = c.req.header('content-type') ?? '';

      if (!contentType.includes('multipart/form-data')) {
        const body = await c.req.json<Record<string, unknown>>();
        const parsed = anonymousCreatePlaceSchema.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
        }

        const contributor = await findContributorBySecret(c.get('db'), parsed.data.secret);
        if (!contributor) {
          return c.json({ error: 'Invalid contributor secret' }, 400);
        }

        const { secret: _secret, ...placeInput } = parsed.data;
        const coords = await resolvePlaceCoordinates(placeInput, c.env.MAPBOX_ACCESS_TOKEN);
        if ('error' in coords) {
          return c.json({ error: coords.error }, 400);
        }

        const place = await createUserPlace(c.get('db'), contributor.id, {
          ...placeInput,
          status: 'DRAFT',
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        return c.json({ data: withResolvedPlacePhoto(place) }, 201);
      }

      const formData = await c.req.formData();
      const secret = formValue(formData, 'secret');
      if (!secret?.trim()) {
        return c.json({ error: 'Invalid contributor secret' }, 400);
      }

      const contributor = await findContributorBySecret(c.get('db'), secret);
      if (!contributor) {
        return c.json({ error: 'Invalid contributor secret' }, 400);
      }

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
      return handleCreatePlace(c, contributor.id, body, photo);
    } catch (err) {
      if (err instanceof Error && err.message !== 'R2_NOT_CONFIGURED') {
        return c.json({ error: err.message }, 400);
      }
      return c.json({ error: 'Database unavailable' }, 503);
    }
  });
}
