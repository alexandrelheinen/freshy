'use client';

import { directionsUrl } from '../lib/api';
import { MaterialIcon } from '@freshy/ui';

export function PlaceActions({
  name,
  latitude,
  longitude,
}: {
  name: string;
  latitude: number;
  longitude: number;
  slug?: string;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <a
        href={directionsUrl(latitude, longitude, name)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-title-md text-on-primary shadow-lg transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        <MaterialIcon name="directions" />
        Get Directions
      </a>
    </div>
  );
}
