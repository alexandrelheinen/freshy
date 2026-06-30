import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_CITY, filterPlacesByRadius, haversineDistanceKm } from './geo';

describe('@freshy/db geo', () => {
  it('computes zero distance for identical points', () => {
    assert.equal(
      haversineDistanceKm(
        PILOT_CITY.latitude,
        PILOT_CITY.longitude,
        PILOT_CITY.latitude,
        PILOT_CITY.longitude,
      ),
      0,
    );
  });

  it('filters places within radius', () => {
    const center = { latitude: 0, longitude: 0 };
    const nearby = { latitude: 0, longitude: 0.001 };
    const far = { latitude: 10, longitude: 10 };
    const result = filterPlacesByRadius([center, nearby, far], 0, 0, 5);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.place, center);
  });
});
