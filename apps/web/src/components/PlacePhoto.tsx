'use client';

import { useEffect, useState } from 'react';
import {
  getPlacePhotoUrl,
  placePhotoSrcAfterError,
  type PlaceCategory,
  type PlacePhotoVariant,
} from '@freshy/ui';

export function PlacePhoto({
  photoUrl,
  category,
  variant = 'full',
  alt = '',
  className,
}: {
  photoUrl: string | null | undefined;
  category: PlaceCategory;
  variant?: PlacePhotoVariant;
  alt?: string;
  className?: string;
}) {
  const resolvedSrc = getPlacePhotoUrl(photoUrl, category, variant);
  const [src, setSrc] = useState(resolvedSrc);

  useEffect(() => {
    setSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        const fallback = placePhotoSrcAfterError(src, category, variant);
        if (fallback) setSrc(fallback);
      }}
    />
  );
}
