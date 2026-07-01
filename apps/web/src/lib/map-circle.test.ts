import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { circlePolygonGeoJson } from './map-circle';

describe('circlePolygonGeoJson', () => {
  it('returns a closed polygon ring centered near the requested point', () => {
    const feature = circlePolygonGeoJson(48.9, 2.3, 1);
    const ring = feature.geometry.coordinates[0] ?? [];
    assert.ok(ring.length > 4);
    assert.deepEqual(ring[0], ring[ring.length - 1]);

    const lngs = ring.map(([lng]) => lng);
    const lats = ring.map(([, lat]) => lat);
    assert.ok(Math.min(...lngs) < 2.3 && Math.max(...lngs) > 2.3);
    assert.ok(Math.min(...lats) < 48.9 && Math.max(...lats) > 48.9);
  });
});
