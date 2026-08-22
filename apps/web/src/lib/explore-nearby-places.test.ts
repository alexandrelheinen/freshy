import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { PlaceDto } from './api';
import { exploreSearchOrigin, nearbyPlacesForList } from './explore-nearby-places';

/** Clichy map default used by Explore when GPS has not been applied. */
const CLICHY = { lat: 48.9042, lng: 2.3064 };
/** User GPS from the Explore nearby-list repro (Paris center). */
const PARIS = { lat: 48.8566, lng: 2.3522 };

function place(slug: string, latitude: number, longitude: number, apiDistanceKm: number): PlaceDto {
  return {
    id: slug,
    slug,
    name: slug,
    latitude,
    longitude,
    category: 'CAFE',
    distanceKm: apiDistanceKm,
    aggregatedFreshnessLevel: 'MODEST_AC',
    tags: [],
    description: null,
    address: null,
    photoUrl: null,
    status: 'PUBLISHED',
  };
}

describe('exploreSearchOrigin', () => {
  it('uses granted GPS as the fetch origin instead of the Clichy map default', () => {
    const query = exploreSearchOrigin({ latitude: PARIS.lat, longitude: PARIS.lng });
    assert.deepEqual(query, PARIS);
    assert.notDeepEqual(query, CLICHY);
  });
});

describe('nearbyPlacesForList', () => {
  it('returns the closest places up to the limit', () => {
    const places = [
      place('a', 48.905, 2.3064, 1),
      place('b', 48.906, 2.3064, 2),
      place('c', 48.907, 2.3064, 3),
    ];
    assert.deepEqual(
      nearbyPlacesForList(places, null, 2, CLICHY).map((entry) => entry.slug),
      ['a', 'b'],
    );
  });

  it('keeps a selected place that is outside the closest set', () => {
    const places = [
      place('near-1', 48.905, 2.3064, 1),
      place('near-2', 48.906, 2.3064, 2),
      place('near-3', 48.907, 2.3064, 3),
      place('far-selected', 48.92, 2.3064, 10),
    ];
    assert.deepEqual(
      nearbyPlacesForList(places, 'far-selected', 3, CLICHY).map((entry) => entry.slug),
      ['far-selected', 'near-1', 'near-2'],
    );
  });

  it('sorts and labels from the same origin, ignoring API kilometers from another center', () => {
    const pavillon = place('pavillon', 48.9045, 2.3058, 0.12);
    const mediatheque = place('mediatheque', 48.9038, 2.3072, 0.18);
    const barber = place('clichy-barber', 48.904, 2.3049, 0.22);
    const francois = place('chez-francois', 48.9029, 2.3081, 0.28);
    const dominos = place('dominos', 48.9024, 2.3088, 0.35);
    const parisCafe = place('paris-cafe', 48.857, 2.3518, 6.4);
    const clichyOrdered = [pavillon, mediatheque, barber, francois, dominos, parisCafe];

    const fromClichy = nearbyPlacesForList(clichyOrdered, null, 5, CLICHY);
    assert.deepEqual(
      fromClichy.map((entry) => entry.slug),
      ['pavillon', 'mediatheque', 'clichy-barber', 'chez-francois', 'dominos'],
    );
    const clichyKm = fromClichy.map((entry) => entry.distanceKm ?? Number.POSITIVE_INFINITY);
    assert.deepEqual(
      clichyKm,
      [...clichyKm].sort((left, right) => left - right),
    );
    assert.ok(clichyKm.every((km) => km <= 3));
    assert.ok((fromClichy[0]?.distanceKm ?? 99) < 0.2);
    assert.notEqual(fromClichy[0]?.distanceKm, pavillon.distanceKm);

    const fromParis = nearbyPlacesForList(clichyOrdered, null, 5, PARIS);
    assert.equal(fromParis[0]?.slug, 'paris-cafe');
    const parisKm = fromParis.map((entry) => entry.distanceKm ?? Number.POSITIVE_INFINITY);
    assert.deepEqual(
      parisKm,
      [...parisKm].sort((left, right) => left - right),
    );
    assert.ok((fromParis[0]?.distanceKm ?? 99) < 0.2);
    assert.notEqual(fromParis[0]?.distanceKm, parisCafe.distanceKm);
    assert.ok((fromParis[fromParis.length - 1]?.distanceKm ?? 0) > 5);
  });
});
