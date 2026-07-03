import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { PlaceDto } from './api';
import { mergePendingMapPlaces } from './pending-map-place';

describe('pending-map-place', () => {
  it('merges staged draft places within the search radius when verified-only is off', () => {
    const apiPlaces: PlaceDto[] = [
      {
        id: 'published-1',
        slug: 'published-cafe',
        name: 'Published Cafe',
        description: null,
        category: 'CAFE',
        latitude: 48.9042,
        longitude: 2.3064,
        address: '1 Rue Published',
        photoUrl: null,
        aggregatedFreshnessLevel: 'MODEST_AC',
        tags: [],
        status: 'PUBLISHED',
      },
    ];

    const pending: PlaceDto[] = [
      {
        id: 'pending-draft-1',
        slug: 'my-draft-cafe',
        name: 'My Draft Cafe',
        description: null,
        category: 'CAFE',
        latitude: 48.905,
        longitude: 2.307,
        address: '2 Rue Draft',
        photoUrl: null,
        aggregatedFreshnessLevel: 'MODEST_AC',
        tags: ['calm'],
        status: 'DRAFT',
      },
    ];

    const merged = mergePendingMapPlaces(
      apiPlaces,
      {
        lat: 48.9042,
        lng: 2.3064,
        radiusKm: 5,
      },
      { pendingPlaces: pending },
    );

    assert.equal(merged.length, 2);
    assert.equal(
      merged.some((place) => place.slug === 'my-draft-cafe'),
      true,
    );
  });

  it('skips staged drafts outside the search radius or active category filter', () => {
    const pending: PlaceDto[] = [
      {
        id: 'pending-draft-far',
        slug: 'far-draft',
        name: 'Far Draft',
        description: null,
        category: 'CAFE',
        latitude: 49.5,
        longitude: 2.9,
        address: null,
        photoUrl: null,
        aggregatedFreshnessLevel: 'MODEST_AC',
        tags: [],
        status: 'DRAFT',
      },
      {
        id: 'pending-draft-bar',
        slug: 'bar-draft',
        name: 'Bar Draft',
        description: null,
        category: 'BAR',
        latitude: 48.905,
        longitude: 2.307,
        address: null,
        photoUrl: null,
        aggregatedFreshnessLevel: 'MODEST_AC',
        tags: [],
        status: 'DRAFT',
      },
    ];

    const merged = mergePendingMapPlaces(
      [],
      {
        lat: 48.9042,
        lng: 2.3064,
        radiusKm: 5,
        category: 'CAFE',
      },
      { pendingPlaces: pending },
    );

    assert.equal(merged.length, 0);
  });
});
