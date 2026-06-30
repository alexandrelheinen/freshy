import { z } from 'zod';
import { AcStrength, PlaceCategory, type PrismaClient } from '@freshy/db';

export const createPlaceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.nativeEnum(PlaceCategory),
  address: z.string().trim().min(3).max(240),
  description: z.string().trim().max(1000).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  aggregatedTemperatureC: z.number().min(16).max(30),
  aggregatedAcStrength: z.nativeEnum(AcStrength),
  amenities: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export function slugifyPlaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uniquePlaceSlug(prisma: PrismaClient, base: string): Promise<string> {
  let slug = base || 'place';
  let suffix = 0;
  while (await prisma.place.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function createUserPlace(
  prisma: PrismaClient,
  userId: string,
  input: CreatePlaceInput,
) {
  const baseSlug = slugifyPlaceName(input.name);
  const slug = await uniquePlaceSlug(prisma, baseSlug);

  return prisma.place.create({
    data: {
      slug,
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      aggregatedTemperatureC: input.aggregatedTemperatureC,
      aggregatedAcStrength: input.aggregatedAcStrength,
      amenities: input.amenities,
      status: input.status,
      createdById: userId,
    },
  });
}
