'use client';

import { directionsUrl } from '../lib/api';
import { MaterialIcon } from '@freshy/ui';

export function PlaceActions({
  latitude,
  longitude,
  address,
}: {
  latitude: number;
  longitude: number;
  address?: string | null;
}) {
  const mapsHref = directionsUrl({ latitude, longitude, address });

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-title-md text-on-primary shadow-lg transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        <MaterialIcon name="directions" />
        Get Directions
      </a>
    </div>
  );
}
