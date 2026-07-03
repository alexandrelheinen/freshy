'use client';

import {
  ALL_PLACE_CATEGORIES,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  type PlaceCategory,
} from '@freshy/ui';
import { useEffect, useMemo, useState } from 'react';
import { PlaceListClient } from './PlaceListClient';
import {
  CATEGORY_PLACES_PAGE_SIZE,
  fetchCategoryPlacesPage,
  type CategoryPlacesPageDto,
} from '../lib/api';
import { locationStatusMessage } from '../lib/location-messages';
import { useUserLocation } from '../lib/use-user-location';
import { useVerifiedOnlyFilter } from '../lib/use-verified-only-filter';

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
    loading: locationLoading,
    requestLocation,
  } = useUserLocation();
  const { verifiedOnly } = useVerifiedOnlyFilter();
  const [page, setPage] = useState(1);
  const [placesPage, setPlacesPage] = useState<CategoryPlacesPageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [category, searchCenter.lat, searchCenter.lng, searchRadiusKm, verifiedOnly]);

  useEffect(() => {
    if (!category) {
      setPlacesPage(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      const data = await fetchCategoryPlacesPage({
        lat: searchCenter.lat,
        lng: searchCenter.lng,
        radius: searchRadiusKm,
        category,
        page,
        limit: CATEGORY_PLACES_PAGE_SIZE,
        verifiedOnly,
      });
      if (cancelled) return;
      if (!data) {
        setLoadError('Could not load places for this category.');
        setPlacesPage(null);
      } else {
        setPlacesPage(data);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [category, page, searchCenter.lat, searchCenter.lng, searchRadiusKm, verifiedOnly]);

  const statusMessage =
    denied || locationError
      ? locationStatusMessage({
          permissionDenied: denied,
          locationError,
          searchRadiusKm,
          usingGps,
        })
      : null;

  const nearbyNotice = useMemo(() => {
    if (!category || loading || loadError || !placesPage) return null;
    if (placesPage.nearbyCount > 0) return null;
    return `No ${title.toLowerCase()} found within ${searchRadiusKm} km.`;
  }, [category, loading, loadError, placesPage, searchRadiusKm, title]);

  const totalPages = Math.max(1, Math.ceil((placesPage?.total ?? 0) / CATEGORY_PLACES_PAGE_SIZE));

  return (
    <PlaceListClient
      title={title}
      subtitle={`All ${title.toLowerCase()} sorted by distance from you.`}
      backHref={ROUTES.cooling}
      places={placesPage?.items ?? []}
      loading={loading}
      loadError={loadError}
      navActive="cooling"
      searchPlaceholder={`Search in ${title}…`}
      emptyMessage={`No ${title.toLowerCase()} in the database yet.`}
      listNotice={nearbyNotice}
      pagination={
        placesPage && placesPage.total > 0
          ? {
              page,
              totalPages,
              total: placesPage.total,
              pageSize: CATEGORY_PLACES_PAGE_SIZE,
              onPageChange: setPage,
            }
          : undefined
      }
      statusBanner={
        statusMessage ? (
          <>
            <p className="text-sm text-on-surface-variant">{statusMessage}</p>
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationLoading}
              className="mt-3 rounded-xl bg-primary px-6 py-3 font-label-caps text-on-primary disabled:opacity-60"
            >
              {locationLoading ? 'Locating…' : 'Use my location'}
            </button>
          </>
        ) : null
      }
    />
  );
}
