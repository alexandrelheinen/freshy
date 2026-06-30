import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('@freshy/db schema', () => {
  it('exports createDb function', async () => {
    const db = await import('./index');
    assert.equal(typeof db.createDb, 'function');
  });

  it('exports expected table names', async () => {
    const { users, places, reviews, savedPlaces } = await import('./schema');
    assert.ok(users, 'users table should be defined');
    assert.ok(places, 'places table should be defined');
    assert.ok(reviews, 'reviews table should be defined');
    assert.ok(savedPlaces, 'savedPlaces table should be defined');
  });

  it('exports PlaceCategory values', async () => {
    const { PLACE_CATEGORIES } = await import('./schema');
    assert.ok(PLACE_CATEGORIES.includes('CAFE'));
    assert.ok(PLACE_CATEGORIES.includes('RESTAURANT'));
    assert.ok(PLACE_CATEGORIES.includes('PUBLIC_SPACE'));
  });

  it('exports FreshnessLevel values', async () => {
    const { FRESHNESS_LEVELS } = await import('./schema');
    assert.ok(FRESHNESS_LEVELS.includes('NONE'));
    assert.ok(FRESHNESS_LEVELS.includes('VERY_COLD_AC'));
  });

  it('exports geo helpers', async () => {
    const { haversineDistanceKm, filterPlacesByRadius, PILOT_CITY } = await import('./index');
    assert.equal(typeof haversineDistanceKm, 'function');
    assert.equal(typeof filterPlacesByRadius, 'function');
    assert.ok(PILOT_CITY.latitude, 'PILOT_CITY should have a latitude');
  });
});
