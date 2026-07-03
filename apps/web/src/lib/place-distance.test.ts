import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  distanceKmFromUser,
  formatPlaceDistanceFromUser,
  haversineDistanceKm,
} from './place-distance';

describe('place-distance', () => {
  it('computes haversine distance between two points', () => {
    const km = haversineDistanceKm(48.9042, 2.3064, 48.905, 2.307);
    assert.ok(km > 0 && km < 0.2);
  });

  it('returns undefined when user GPS is unavailable', () => {
    assert.equal(distanceKmFromUser({ latitude: 48.9042, longitude: 2.3064 }, null), undefined);
    assert.equal(formatPlaceDistanceFromUser({ latitude: 48.9042, longitude: 2.3064 }, null), '');
  });

  it('formats walk time from user position', () => {
    const label = formatPlaceDistanceFromUser(
      { latitude: 48.905, longitude: 2.307 },
      { lat: 48.9042, lng: 2.3064 },
    );
    assert.match(label, /walk$/);
    assert.match(label, /m|km/);
  });
});
