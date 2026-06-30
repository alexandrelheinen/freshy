import { resolvePlacePhotoUrl, type PlacePhotoCategory } from '@freshy/config/place-photos';

export function resolvePlacePhotoForApi(
  photoUrl: string | null | undefined,
  category: PlacePhotoCategory,
): string {
  return resolvePlacePhotoUrl(photoUrl, category, process.env.R2_PUBLIC_URL || undefined);
}
