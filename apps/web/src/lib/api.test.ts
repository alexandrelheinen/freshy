import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORY_PLACES_PAGE_SIZE,
  buildCategoryPlacesPageFromList,
  buildPlacesSearchParams,
  directionsUrl,
  filterPlacesByMinFreshnessLevel,
  formatDistance,
  formatDistanceWithWalk,
  formatRelativeTime,
  formatWalkTime,
  freshnessBarState,
  mergeDraftPlacesIntoResults,
  placeMatchesMinFreshnessFilter,
} from './api';

describe('@freshy/web api helpers', () => {
  it('formats sub-kilometer distances in meters', () => {
    assert.equal(formatDistance(0.25), '250m');
  });

  it('formats walk time from distance', () => {
    assert.equal(formatWalkTime(0.25), '3 mins walk');
    assert.equal(formatDistanceWithWalk(0.25), '250m • 3 mins walk');
  });

  it('formats relative review timestamps', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    assert.equal(formatRelativeTime(yesterday), 'Yesterday');
  });

  it('maps freshness level to bar segments', () => {
    assert.equal(freshnessBarState('VERY_COLD_AC').segments, 3);
    assert.equal(freshnessBarState('GOOD_VENTILATION').segments, 1);
    assert.equal(freshnessBarState('NATURALLY_FRESH').tone, 'green');
  });

  it('builds directions URL from address when available', () => {
    const url = directionsUrl({
      latitude: 48.9042,
      longitude: 2.3064,
      address: 'Rue Martre, 92110 Clichy',
    });
    assert.match(url, /destination=Rue%20Martre/);
    assert.doesNotMatch(url, /48\.9042/);
  });

  it('builds directions URL from coordinates when address is missing', () => {
    const url = directionsUrl({ latitude: 48.9042, longitude: 2.3064, address: null });
    assert.equal(url, 'https://www.google.com/maps/dir/?api=1&destination=48.9042,2.3064');
  });

  it('merges draft places without duplicating slugs already returned by the API', () => {
    const published = [
      {
        id: '1',
        slug: 'cafe-a',
        name: 'Cafe A',
        description: null,
        category: 'CAFE',
        latitude: 48.9,
        longitude: 2.3,
        address: null,
        aggregatedFreshnessLevel: 'MODEST_AC' as const,
        status: 'PUBLISHED' as const,
      },
    ];
    const drafts = [
      {
        id: '2',
        slug: 'cafe-draft',
        name: 'Draft Cafe',
        description: null,
        category: 'CAFE',
        latitude: 48.91,
        longitude: 2.31,
        address: null,
        aggregatedFreshnessLevel: 'MODEST_AC' as const,
        status: 'DRAFT' as const,
      },
      {
        id: '3',
        slug: 'cafe-a',
        name: 'Cafe A Duplicate',
        description: null,
        category: 'CAFE',
        latitude: 48.9,
        longitude: 2.3,
        address: null,
        aggregatedFreshnessLevel: 'MODEST_AC' as const,
        status: 'DRAFT' as const,
      },
    ];

    const merged = mergeDraftPlacesIntoResults(published, drafts);
    assert.equal(merged.length, 2);
    assert.equal(
      merged.some((place) => place.slug === 'cafe-draft'),
      true,
    );
  });

  it('omits verifiedOnly from places query unless the filter is enabled', () => {
    const off = buildPlacesSearchParams({
      lat: 48.9042,
      lng: 2.3064,
      radius: 5,
      verifiedOnly: false,
    });
    assert.equal(off.has('verifiedOnly'), false);

    const on = buildPlacesSearchParams({
      lat: 48.9042,
      lng: 2.3064,
      radius: 5,
      verifiedOnly: true,
    });
    assert.equal(on.get('verifiedOnly'), 'true');
  });

  it('uses five places per page for category list defaults', () => {
    assert.equal(CATEGORY_PLACES_PAGE_SIZE, 5);
  });

  it('paginates category places by distance for fallback list views', () => {
    const page = buildCategoryPlacesPageFromList(
      [
        {
          id: '1',
          slug: 'near',
          name: 'Near Bar',
          description: null,
          category: 'BAR',
          latitude: 48.9,
          longitude: 2.3,
          address: null,
          aggregatedFreshnessLevel: 'MODEST_AC',
          distanceKm: 0.5,
        },
        {
          id: '2',
          slug: 'far',
          name: 'Far Bar',
          description: null,
          category: 'BAR',
          latitude: 49.5,
          longitude: 2.8,
          address: null,
          aggregatedFreshnessLevel: 'MODEST_AC',
          distanceKm: 12,
        },
      ],
      { page: 1, limit: 1, radiusKm: 3 },
    );

    assert.equal(page.items.length, 1);
    assert.equal(page.items[0]?.slug, 'near');
    assert.equal(page.total, 2);
    assert.equal(page.nearbyCount, 1);
  });

  it('excludes level 0 places when minimum freshness is higher', () => {
    const places = [
      {
        id: '1',
        slug: 'cold',
        name: 'Cold Spot',
        description: null,
        category: 'CAFE',
        latitude: 48.9,
        longitude: 2.3,
        address: null,
        aggregatedFreshnessLevel: 'VERY_COLD_AC' as const,
      },
      {
        id: '2',
        slug: 'none',
        name: 'No Cooling',
        description: null,
        category: 'CAFE',
        latitude: 48.9,
        longitude: 2.3,
        address: null,
        aggregatedFreshnessLevel: 'NONE' as const,
      },
    ];

    assert.equal(placeMatchesMinFreshnessFilter(places[1]!, 2), false);
    assert.equal(filterPlacesByMinFreshnessLevel(places, 2).length, 1);
    assert.equal(filterPlacesByMinFreshnessLevel(places, 2)[0]?.slug, 'cold');
  });
});
