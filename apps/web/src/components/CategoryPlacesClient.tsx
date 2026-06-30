'use client';

import { ALL_PLACE_CATEGORIES, PILOT_CITY, PLACE_CATEGORY_LABELS, ROUTES, type PlaceCategory } from '@freshy/ui';
import { useCallback } from 'react';
import { PlaceListClient } from './PlaceListClient';
import { fetchPlaces } from '../lib/api';

function parseCategory(raw: string): PlaceCategory | null {
  const upper = raw.toUpperCase().replace(/-/g, '_');
  if (ALL_PLACE_CATEGORIES.includes(upper as PlaceCategory)) {
    return upper as PlaceCategory;
  }
  return null;
}

export function CategoryPlacesClient({ categorySlug }: { categorySlug: string }) {
  const category = parseCategory(categorySlug);
  const title = category
    ? PLACE_CATEGORY_LABELS[category]
    : categorySlug.replace(/-/g, ' ');

  const loadPlaces = useCallback(async () => {
    if (!category) return [];
    return fetchPlaces({
      lat: PILOT_CITY.latitude,
      lng: PILOT_CITY.longitude,
      radius: 10,
      category,
    });
  }, [category]);

  return (
    <PlaceListClient
      title={title}
      subtitle={`Browse ${title.toLowerCase()} with reliable cooling nearby.`}
      backHref={ROUTES.cooling}
      loadPlaces={loadPlaces}
      navActive="cooling"
      searchPlaceholder={`Search in ${title}…`}
      emptyMessage={`No ${title.toLowerCase()} found nearby.`}
    />
  );
}
