import type { CreatePlaceInput } from './create-place';
import { createPlaceSchema } from './create-place';
import { geocodeAddress } from './geocode';

export type ResolvedCoordinates = { latitude: number; longitude: number } | { error: string };

export async function resolvePlaceCoordinates(
  input: Pick<CreatePlaceInput, 'address' | 'latitude' | 'longitude'>,
): Promise<ResolvedCoordinates> {
  const geocoded = await geocodeAddress(input.address);
  if (geocoded) {
    return { latitude: geocoded.latitude, longitude: geocoded.longitude };
  }

  if (input.latitude != null && input.longitude != null) {
    return { latitude: input.latitude, longitude: input.longitude };
  }

  return {
    error:
      'Could not resolve this address. Check the spelling or tap MAP to use your current location.',
  };
}

export function parseCreatePlaceFields(
  body: Record<string, unknown>,
): ReturnType<typeof createPlaceSchema.safeParse> {
  const tags = parseTagsField(body.tags);

  const latitude = parseOptionalNumber(body.latitude);
  const longitude = parseOptionalNumber(body.longitude);

  return createPlaceSchema.safeParse({
    name: body.name,
    category: body.category,
    address: body.address,
    description: typeof body.description === 'string' ? body.description : undefined,
    latitude,
    longitude,
    aggregatedFreshnessLevel: body.aggregatedFreshnessLevel,
    tags,
    status: 'DRAFT',
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
