'use client';

import {
  ALL_PLACE_CATEGORIES,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  type PlaceCategory,
} from '@freshy/ui';
import { useEffect, useState } from 'react';
import { PlaceListClient } from './PlaceListClient';
import { PlaceSearchField } from './PlaceSearchField';
import {
  CATEGORY_PLACES_PAGE_SIZE,
  fetchCategoryPlacesPage,
  type CategoryPlacesPageDto,
} from '../lib/api';
import { categoryPlacesEmptyMessage } from '../lib/category-places-messages';
import { locationStatusMessage } from '../lib/location-messages';
import { useUserLocation } from '../lib/use-user-location';
import { minFreshnessScore } from '../lib/min-freshness-filter-storage';
import { useMinFreshnessFilter } from '../lib/use-min-freshness-filter';
import { CATEGORY_PLACE_SEARCH_COPY } from '../lib/place-search-copy';
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
  const { minFreshnessLevel } = useMinFreshnessFilter();
  const minFreshnessScoreValue = minFreshnessScore(minFreshnessLevel);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [placesPage, setPlacesPage] = useState<CategoryPlacesPageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    setSearchInput('');
    setAppliedQuery('');
  }, [category]);

  useEffect(() => {
    setPage(1);
  }, [
    searchCenter.lat,
    searchCenter.lng,
    searchRadiusKm,
    verifiedOnly,
    minFreshnessScoreValue,
    appliedQuery,
  ]);

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
        minFreshnessLevel: minFreshnessScoreValue,
        q: appliedQuery,
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
  }, [
    category,
    page,
    searchCenter.lat,
    searchCenter.lng,
    searchRadiusKm,
    verifiedOnly,
    minFreshnessScoreValue,
    appliedQuery,
  ]);

  const statusMessage =
    denied || locationError
      ? locationStatusMessage({
          permissionDenied: denied,
          locationError,
          searchRadiusKm,
          usingGps,
        })
      : null;

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
      emptyMessage={categoryPlacesEmptyMessage(title, verifiedOnly, appliedQuery)}
      toolbar={
        <PlaceSearchField
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={() => setAppliedQuery(searchInput.trim())}
          onClear={() => {
            setSearchInput('');
            setAppliedQuery('');
          }}
          placeholder={CATEGORY_PLACE_SEARCH_COPY.placeholder}
          ariaLabel={CATEGORY_PLACE_SEARCH_COPY.ariaLabel}
        />
      }
      pagination={
        category
          ? {
              page,
              totalPages,
              total: placesPage?.total ?? 0,
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
