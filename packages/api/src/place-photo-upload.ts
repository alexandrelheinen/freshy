import { randomUUID } from 'node:crypto';
import { uploadAsset, isR2Configured } from './storage/r2';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validatePlacePhoto(
  buffer: Buffer,
  mimeType: string,
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_PHOTO_TYPES.has(mimeType)) {
    return { ok: false, error: 'Photo must be PNG, JPG, or WebP.' };
  }
  if (buffer.length > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'Photo must be 10MB or smaller.' };
  }
  return { ok: true };
}

function photoExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

/** Upload a user-submitted venue photo to R2 under `places/{slug}/`. */
export async function uploadPlacePhoto(
  slug: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error('R2_NOT_CONFIGURED');
  }
  const validation = validatePlacePhoto(buffer, mimeType);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  const objectPath = `places/${slug}/${randomUUID()}.${photoExtension(mimeType)}`;
  const result = await uploadAsset(objectPath, buffer, mimeType);
  return result.publicUrl;
}
