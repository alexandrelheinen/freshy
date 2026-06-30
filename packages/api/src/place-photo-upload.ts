import { randomUUID } from 'node:crypto';
import { uploadAsset, isR2Configured, type R2Context } from './storage/r2';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validatePlacePhoto(
  data: ArrayBuffer | Uint8Array,
  mimeType: string,
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_PHOTO_TYPES.has(mimeType)) {
    return { ok: false, error: 'Photo must be PNG, JPG, or WebP.' };
  }
  const byteLength = data instanceof ArrayBuffer ? data.byteLength : data.length;
  if (byteLength > MAX_PHOTO_BYTES) {
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
  data: ArrayBuffer | Uint8Array,
  mimeType: string,
  r2: R2Context,
): Promise<string> {
  if (!isR2Configured(r2)) {
    throw new Error('R2_NOT_CONFIGURED');
  }
  const validation = validatePlacePhoto(data, mimeType);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  const objectPath = `places/${slug}/${randomUUID()}.${photoExtension(mimeType)}`;
  const result = await uploadAsset(r2, objectPath, data, mimeType);
  return result.publicUrl;
}
