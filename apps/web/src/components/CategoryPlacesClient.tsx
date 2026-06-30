'use client';

import {
  ALL_PLACE_CATEGORIES,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  type PlaceCategory,
} from '@freshy/ui';
import { useCallback } from 'react';
import { PlaceListClient } from './PlaceListClient';
import { fetchPlaces } from '../lib/api';
import { useUserLocation } from '../lib/use-user-location';

function parseCategory(raw: string): PlaceCategory | null {
  const upper = raw.toUpperCase().replace(/-/g, '_');
  if (ALL_PLACE_CATEGORIES.includes(upper as PlaceCategory)) {
    return upper as PlaceCategory;
  }
  return null;
}

export function CategoryPlacesClient({ categorySlug }: { categorySlug: string }) {
  const category = parseCategory(categorySlug);
  const title = category ? PLACE_CATEGORY_LABELS[category] : categorySlug.replace(/-/g, ' ');
  const { location, denied, requestLocation } = useUserLocation();

  const loadPlaces = useCallback(async () => {
    if (!category || !location) return [];
    return fetchPlaces({
      lat: location.lat,
      lng: location.lng,
      radius: 3,
      category,
    });
  }, [category, location]);

  if (denied || !location) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-mobile-nav text-center">
        <p className="text-on-surface-variant">
          Enable location to browse {title.toLowerCase()} within 3 km of you.
        </p>
        <button
          type="button"
          onClick={requestLocation}
          className="mt-4 rounded-xl bg-primary px-6 py-3 font-label-caps text-on-primary"
        >
          Use my location
        </button>
      </div>
    );
  }

  return (
    <PlaceListClient
      title={title}
      subtitle={`Browse ${title.toLowerCase()} with reliable cooling nearby.`}
      backHref={ROUTES.cooling}
      loadPlaces={loadPlaces}
      navActive="cooling"
      searchPlaceholder={`Search in ${title}…`}
      emptyMessage={`No ${title.toLowerCase()} found within 3 km.`}
    />
  );
}
