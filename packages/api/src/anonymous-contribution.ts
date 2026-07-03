import { z } from 'zod';
import { createPlaceSchema } from './create-place';

export const anonymousCreatePlaceSchema = createPlaceSchema.extend({
  secret: z.string().trim().min(1),
});

export type AnonymousCreatePlaceInput = z.infer<typeof anonymousCreatePlaceSchema>;

export function parseAnonymousCreatePlaceFields(
  body: Record<string, unknown>,
): ReturnType<typeof anonymousCreatePlaceSchema.safeParse> {
  const tags = parseTagsField(body.tags);
  const latitude = parseOptionalNumber(body.latitude);
  const longitude = parseOptionalNumber(body.longitude);

  return anonymousCreatePlaceSchema.safeParse({
    name: body.name,
    category: body.category,
    address: body.address,
    description: typeof body.description === 'string' ? body.description : undefined,
    latitude,
    longitude,
    aggregatedFreshnessLevel: body.aggregatedFreshnessLevel,
    tags,
    status: 'DRAFT',
    secret: typeof body.secret === 'string' ? body.secret : undefined,
  });
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseTagsField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string');
  }
  if (typeof value !== 'string' || value.trim() === '') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [];
  } catch {
    return [];
  }
}
