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
import { locationStatusMessage } from '../lib/location-messages';
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
  const {
    searchCenter,
    searchRadiusKm,
    denied,
    locationError,
    usingGps,
    loading,
    requestLocation,
  } = useUserLocation();

  const loadPlaces = useCallback(async () => {
    if (!category) return [];
    return fetchPlaces({
      lat: searchCenter.lat,
      lng: searchCenter.lng,
      radius: searchRadiusKm,
      category,
    });
  }, [category, searchCenter, searchRadiusKm]);

  const statusMessage = locationStatusMessage({
    permissionDenied: denied,
    locationError,
    searchRadiusKm,
    usingGps,
  });

  return (
    <div className="min-h-screen pb-8" data-page="place-list">
      {statusMessage ? (
        <div className="border-b border-outline-variant/20 bg-surface-container-low px-6 py-4 text-center">
          <p className="text-sm text-on-surface-variant">{statusMessage}</p>
          <button
            type="button"
            onClick={requestLocation}
            disabled={loading}
            className="mt-3 rounded-xl bg-primary px-6 py-3 font-label-caps text-on-primary disabled:opacity-60"
          >
            {loading ? 'Locating…' : 'Use my location'}
          </button>
        </div>
      ) : null}
      <PlaceListClient
        title={title}
        subtitle={`Browse ${title.toLowerCase()} with reliable cooling nearby.`}
        backHref={ROUTES.cooling}
        loadPlaces={loadPlaces}
        navActive="cooling"
        searchPlaceholder={`Search in ${title}…`}
        emptyMessage={`No ${title.toLowerCase()} found within ${searchRadiusKm} km.`}
      />
    </div>
  );
}
