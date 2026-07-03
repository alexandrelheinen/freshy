import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { PlaceDto } from './api';
import { nearbyPlacesForList } from './explore-nearby-places';

function place(slug: string, distanceKm: number): PlaceDto {
  return {
    id: slug,
    slug,
    name: slug,
    latitude: 48.9,
    longitude: 2.3,
    category: 'CAFE',
    distanceKm,
    aggregatedFreshnessLevel: 'MODEST_AC',
    tags: [],
    description: null,
    address: null,
    photoUrl: null,
    status: 'PUBLISHED',
  };
}

describe('nearbyPlacesForList', () => {
  it('returns the closest places up to the limit', () => {
    const places = [place('a', 1), place('b', 2), place('c', 3)];
    assert.deepEqual(
      nearbyPlacesForList(places, null, 2).map((entry) => entry.slug),
      ['a', 'b'],
    );
  });

  it('keeps a selected place that is outside the closest set', () => {
    const places = [
      place('near-1', 1),
      place('near-2', 2),
      place('near-3', 3),
      place('far-selected', 10),
    ];
    assert.deepEqual(
      nearbyPlacesForList(places, 'far-selected', 3).map((entry) => entry.slug),
      ['far-selected', 'near-1', 'near-2'],
    );
  });
});
